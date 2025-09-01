#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
startDev.py — GUI לניהול פיתוח/דיפלוי של Firebase + אינטגרציית Git

יכולות:
- אמולטורים מקומיים: Hosting / Functions / Firestore / Auth (חלון אחד)
- Deploy: hosting בלבד, functions בלבד, או שניהם יחד
- בחירת alias של פרויקט (מתוך .firebaserc אם קיים)
- לוג חי + פתיחת קישורי localhost/UI ו-production
- אינטגרציית Git:
  * git status / pull / add-commit-push (בחירת branch + הודעת קומיט)
  * Trigger CI: יצירת empty commit + push
  * פתיחת דף ה-Actions של הרפו (נשלף אוטומטית מ-remote.origin.url)

תלויות:
- Python 3
- Firebase CLI מותקן ופעיל ב-PATH (firebase --version)
- Git מותקן ופעיל ב-PATH (git --version)

הרצה:
  python startDev.py
"""

import json
import os
import re
import subprocess
import threading
import queue
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox

APP_TITLE = "Vibe Studio — Dev & Deploy (with Git)"
DEFAULT_PORTS = {
    "hosting": 5000,
    "functions": 5001,
    "firestore": 8080,
    "auth": 9099,
    "ui": 4000,
}

# ------------------------- helpers -------------------------

def run_capture(cmd: str) -> str:
    try:
        out = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, universal_newlines=True)
        return out
    except subprocess.CalledProcessError as e:
        return e.output or str(e)


def find_project_aliases():
    aliases = []
    try:
        with open(".firebaserc", "r", encoding="utf-8") as f:
            rc = json.load(f)
        projects = rc.get("projects", {})
        aliases = list(projects.keys())
    except Exception:
        pass
    return aliases


def detect_public_dir():
    try:
        with open("firebase.json", "r", encoding="utf-8") as f:
            cfg = json.load(f)
        pub = (cfg.get("hosting") or {}).get("public")
        return pub or "."
    except Exception:
        return "?"


def detect_repo_web_url() -> str:
    """נסה להסיק URL אינטרנט מהרימוֹט 'origin'.
    תומך ב-HTTPS וב-SSH."""
    url = run_capture("git config --get remote.origin.url").strip()
    if not url:
        return ""
    # examples:
    # https://github.com/mlivneh/fireclassStudio.git
    # git@github.com:mlivneh/fireclassStudio.git
    m = re.search(r"github\.com[:/](.+?)(\.git)?$", url)
    if not m:
        return ""
    repo = m.group(1)
    return f"https://github.com/{repo}"


def get_current_branch():
    """זיהוי אוטומטי של Branch נוכחי"""
    try:
        branch = run_capture("git branch --show-current").strip()
        return branch or "main"
    except:
        return "main"


def load_preferences():
    """טען העדפות שמורות"""
    try:
        with open(".dev_preferences.json", "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return {}


def save_preferences(prefs):
    """שמור העדפות"""
    try:
        with open(".dev_preferences.json", "w", encoding="utf-8") as f:
            json.dump(prefs, f, indent=2)
    except Exception as e:
        print(f"Failed to save preferences: {e}")


class ProcRunner:
    def __init__(self, append_log_cb, status_cb):
        self.proc = None
        self.append = append_log_cb
        self.set_status = status_cb
        self.q = queue.Queue()
        self.reader_thread = None

    def run(self, cmd, cwd=None, timeout=300):
        if self.proc and self.proc.poll() is None:
            self.append("Another process is running. Stop it first.\n", "warning")
            return
        
        self.append(f"$ {cmd}\n", "command")
        self.set_status(f"Running: {cmd[:50]}...")
        
        self.proc = subprocess.Popen(
            cmd,
            cwd=cwd,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1,
            universal_newlines=True,
        )
        self.reader_thread = threading.Thread(target=self._pump, daemon=True)
        self.reader_thread.start()

    def _pump(self):
        try:
            for line in self.proc.stdout:
                self.q.put(("output", line))
            self.q.put(("status", "Process completed"))
        except Exception as e:
            self.q.put(("error", f"[reader error] {e}\n"))
        finally:
            self.q.put(("status", "Ready"))

    def poll_log(self):
        try:
            while True:
                msg_type, content = self.q.get_nowait()
                if msg_type == "output":
                    self.append(content)
                elif msg_type == "status":
                    self.set_status(content)
                elif msg_type == "error":
                    self.append(content, "error")
        except queue.Empty:
            pass

    def stop(self):
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
                self.set_status("Process terminated")
            except Exception:
                pass
        self.proc = None

# ------------------------- GUI -------------------------

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1000x720")

        self.aliases = find_project_aliases()
        self.public_dir = detect_public_dir()
        self.repo_web = detect_repo_web_url()
        self.prefs = load_preferences()

        self.runner = ProcRunner(self._append_log, self._set_status)
        self.last_cmd = ""

        self._build_ui()
        self.after(50, self._tick)  # Faster polling
        
        # Load saved preferences
        self._load_saved_prefs()

    def _set_status(self, text):
        """Update status bar"""
        self.status_bar.config(text=text)

    def _load_saved_prefs(self):
        """Load saved preferences into UI"""
        if "last_branch" in self.prefs:
            self.branch_var.set(self.prefs["last_branch"])
        if "default_alias" in self.prefs and self.prefs["default_alias"] in self.aliases:
            self.alias_var.set(self.prefs["default_alias"])
        if "emulator_settings" in self.prefs:
            emu_prefs = self.prefs["emulator_settings"]
            self.var_hosting.set(emu_prefs.get("hosting", True))
            self.var_functions.set(emu_prefs.get("functions", True))
            self.var_firestore.set(emu_prefs.get("firestore", False))
            self.var_auth.set(emu_prefs.get("auth", False))

    def _save_current_prefs(self):
        """Save current UI state to preferences"""
        self.prefs.update({
            "last_branch": self.branch_var.get(),
            "default_alias": self.alias_var.get(),
            "emulator_settings": {
                "hosting": self.var_hosting.get(),
                "functions": self.var_functions.get(),
                "firestore": self.var_firestore.get(),
                "auth": self.var_auth.get(),
            }
        })
        save_preferences(self.prefs)

    # UI construction
    def _build_ui(self):
        nb = ttk.Notebook(self)
        nb.pack(fill="both", expand=True)

        # Tab 1: Emulators
        self.tab_emus = ttk.Frame(nb)
        nb.add(self.tab_emus, text="Emulators")
        self._build_emus_tab(self.tab_emus)

        # Tab 2: Deploy
        self.tab_deploy = ttk.Frame(nb)
        nb.add(self.tab_deploy, text="Deploy")
        self._build_deploy_tab(self.tab_deploy)

        # Tab 3: Git
        self.tab_git = ttk.Frame(nb)
        nb.add(self.tab_git, text="Git")
        self._build_git_tab(self.tab_git)
        
        # Tab 4: System Health
        self.tab_health = ttk.Frame(nb)
        nb.add(self.tab_health, text="System Health")
        self._build_health_tab(self.tab_health)

        # Log area (common)
        logf = ttk.LabelFrame(self, text="Log")
        logf.pack(fill="both", expand=True, padx=10, pady=8)
        
        # Log controls
        log_controls = ttk.Frame(logf)
        log_controls.pack(fill="x")
        ttk.Button(log_controls, text="Clear Log", command=self.clear_log).pack(side="right", padx=5, pady=2)
        
        self.log = tk.Text(logf, wrap="word", height=18)
        self.log.pack(fill="both", expand=True)
        self.log.configure(font=("Consolas", 10))
        
        # Configure log colors
        self.log.tag_config("error", foreground="red")
        self.log.tag_config("warning", foreground="orange")
        self.log.tag_config("success", foreground="green")
        self.log.tag_config("command", foreground="blue", font=("Consolas", 10, "bold"))

        # Status bar
        self.status_bar = ttk.Label(self, text="Ready", relief="sunken")
        self.status_bar.pack(side="bottom", fill="x")

    def _build_emus_tab(self, root):
        top = ttk.LabelFrame(root, text="Local Emulators")
        top.pack(fill="x", padx=10, pady=8)

        self.var_hosting = tk.BooleanVar(value=True)
        self.var_functions = tk.BooleanVar(value=True)
        self.var_firestore = tk.BooleanVar(value=False)
        self.var_auth = tk.BooleanVar(value=False)

        ttk.Checkbutton(top, text="Hosting (5000)", variable=self.var_hosting).pack(side="left", padx=6, pady=6)
        ttk.Checkbutton(top, text="Functions (5001)", variable=self.var_functions).pack(side="left", padx=6, pady=6)
        ttk.Checkbutton(top, text="Firestore (8080)", variable=self.var_firestore).pack(side="left", padx=6, pady=6)
        ttk.Checkbutton(top, text="Auth (9099)", variable=self.var_auth).pack(side="left", padx=6, pady=6)

        ttk.Button(top, text="Start Selected", command=self.start_emus).pack(side="left", padx=8)
        ttk.Button(top, text="Stop", command=self.stop_current).pack(side="left", padx=8)
        ttk.Button(top, text="Open Emulator UI (4000)", command=self.open_ui).pack(side="left", padx=8)
        ttk.Button(top, text="Open Local Sites", command=self.open_local_sites).pack(side="left", padx=8)

        info = ttk.Label(root, text=f"Detected hosting public dir: {self.public_dir}")
        info.pack(anchor="w", padx=12)

    def _build_deploy_tab(self, root):
        dep = ttk.LabelFrame(root, text="Deploy to Firebase Hosting / Functions")
        dep.pack(fill="x", padx=10, pady=8)

        row = ttk.Frame(dep); row.pack(fill="x", padx=6, pady=4)
        ttk.Label(row, text="Project alias (from .firebaserc):").pack(side="left")
        self.alias_var = tk.StringVar(value=(self.aliases[0] if self.aliases else "default"))
        self.alias_cb = ttk.Combobox(row, textvariable=self.alias_var, values=self.aliases, width=20)
        self.alias_cb.pack(side="left", padx=6)
        ttk.Label(row, text="(or type another alias)").pack(side="left", padx=6)

        self.dep_mode = tk.StringVar(value="both")
        modes = ttk.Frame(dep); modes.pack(fill="x", padx=6, pady=6)
        ttk.Radiobutton(modes, text="Client only (hosting)", value="hosting", variable=self.dep_mode).pack(side="left", padx=6)
        ttk.Radiobutton(modes, text="Server only (functions)", value="functions", variable=self.dep_mode).pack(side="left", padx=6)
        ttk.Radiobutton(modes, text="Both", value="both", variable=self.dep_mode).pack(side="left", padx=6)

        btns = ttk.Frame(dep); btns.pack(fill="x", padx=6, pady=4)
        ttk.Button(btns, text="Deploy", command=self.deploy).pack(side="left", padx=6)
        ttk.Button(btns, text="Copy last command", command=self.copy_last_cmd).pack(side="left", padx=6)
        ttk.Button(btns, text="Open Live (web.app)", command=self.open_live).pack(side="left", padx=6)

    def _build_git_tab(self, root):
        g1 = ttk.LabelFrame(root, text="Basic")
        g1.pack(fill="x", padx=10, pady=8)

        ttk.Button(g1, text="git status", command=self.git_status).pack(side="left", padx=6, pady=6)
        ttk.Button(g1, text="git pull --rebase", command=self.git_pull).pack(side="left", padx=6, pady=6)

        g2 = ttk.LabelFrame(root, text="Commit & Push")
        g2.pack(fill="x", padx=10, pady=8)

        ttk.Label(g2, text="Branch:").pack(side="left")
        self.branch_var = tk.StringVar(value=get_current_branch())
        ttk.Entry(g2, textvariable=self.branch_var, width=18).pack(side="left", padx=6)

        ttk.Label(g2, text="Commit message:").pack(side="left")
        self.msg_var = tk.StringVar(value="update")
        ttk.Entry(g2, textvariable=self.msg_var, width=40).pack(side="left", padx=6)

        self.force_push = tk.BooleanVar(value=False)
        ttk.Checkbutton(g2, text="--force", variable=self.force_push).pack(side="left", padx=6)

        ttk.Button(g2, text="Add + Commit + Push", command=self.git_acp).pack(side="left", padx=8)
        ttk.Button(g2, text="Trigger CI (empty commit)", command=self.git_trigger_ci).pack(side="left", padx=8)

        g3 = ttk.LabelFrame(root, text="GitHub")
        g3.pack(fill="x", padx=10, pady=8)
        ttk.Button(g3, text="Open Repo", command=self.open_repo).pack(side="left", padx=6, pady=6)
        ttk.Button(g3, text="Open GitHub Actions", command=self.open_actions).pack(side="left", padx=6, pady=6)

    def _build_health_tab(self, root):
        """טאב לבדיקת מערכת"""
        sys_frame = ttk.LabelFrame(root, text="System Check")
        sys_frame.pack(fill="x", padx=10, pady=8)
        
        ttk.Button(sys_frame, text="Check System Health", 
                   command=lambda: self.runner.run("./check-system.sh")).pack(side="left", padx=6, pady=6)
        ttk.Button(sys_frame, text="Setup Secrets", 
                   command=lambda: self.runner.run("./setup-secrets.sh")).pack(side="left", padx=6, pady=6)
        
        info_frame = ttk.LabelFrame(root, text="Project Info")
        info_frame.pack(fill="x", padx=10, pady=8)
        
        # Show current project info
        info_text = f"Public Dir: {self.public_dir}\n"
        info_text += f"Git Repo: {self.repo_web or 'Not detected'}\n"
        info_text += f"Current Branch: {get_current_branch()}\n"
        info_text += f"Firebase Aliases: {', '.join(self.aliases) if self.aliases else 'None'}"
        
        ttk.Label(info_frame, text=info_text, justify="left").pack(anchor="w", padx=6, pady=6)

    # --------------- log plumbing ---------------
    def _append_log(self, s: str, tag=None):
        # Smart coloring based on content
        if not tag:
            s_lower = s.lower()
            if any(word in s_lower for word in ["error", "failed", "fatal"]):
                tag = "error"
            elif any(word in s_lower for word in ["warning", "warn"]):
                tag = "warning"
            elif any(word in s_lower for word in ["success", "completed", "deployed"]):
                tag = "success"
        
        self.log.insert("end", s, tag)
        self.log.see("end")
        
    def clear_log(self):
        """Clear the log"""
        self.log.delete(1.0, "end")
        self._append_log("Log cleared.\n", "success")

    def _tick(self):
        self.runner.poll_log()
        self.after(50, self._tick)

    # --------------- Emulators ---------------
    def compose_emulators_cmd(self):
        selected = []
        if self.var_hosting.get(): selected.append("hosting")
        if self.var_functions.get(): selected.append("functions")
        if self.var_firestore.get(): selected.append("firestore")
        if self.var_auth.get(): selected.append("auth")
        if not selected:
            messagebox.showinfo("Nothing selected", "Select at least one emulator.")
            return None
        only = ",".join(selected)
        return f"firebase emulators:start --only {only}"

    def start_emus(self):
        cmd = self.compose_emulators_cmd()
        if not cmd:
            return
        self.last_cmd = cmd
        self._save_current_prefs()  # Save emulator preferences
        self.runner.run(cmd)

    def stop_current(self):
        self.runner.stop()
        self._append_log("\n[stopped]\n", "warning")

    def open_ui(self):
        webbrowser.open(f"http://localhost:{DEFAULT_PORTS['ui']}")

    def open_local_sites(self):
        if self.var_hosting.get():
            webbrowser.open(f"http://localhost:{DEFAULT_PORTS['hosting']}")
        if self.var_functions.get():
            webbrowser.open(f"http://localhost:{DEFAULT_PORTS['functions']}")
        if self.var_firestore.get():
            webbrowser.open(f"http://localhost:{DEFAULT_PORTS['firestore']}")
        if self.var_auth.get():
            webbrowser.open(f"http://localhost:{DEFAULT_PORTS['auth']}")

    # --------------- Deploy ---------------
    def ensure_alias(self):
        alias = self.alias_var.get().strip()
        if not alias:
            return None
        try:
            subprocess.run(f"firebase use {alias}", shell=True, check=False,
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        except Exception:
            pass
        return alias

    def deploy(self):
        # Check required files exist
        if not os.path.exists("firebase.json"):
            messagebox.showerror("Error", "firebase.json not found! Initialize Firebase first.")
            return
        
        mode = self.dep_mode.get()
        if mode in ["functions", "both"] and not os.path.exists("functions/index.js"):
            result = messagebox.askquestion("Warning", 
                "functions/index.js not found - functions deploy may fail. Continue anyway?")
            if result == "no":
                return
        
        self.ensure_alias()
        if mode == "hosting":
            cmd = "firebase deploy --only hosting"
        elif mode == "functions":
            cmd = "firebase deploy --only functions"
        else:
            cmd = "firebase deploy --only hosting,functions"
        
        self.last_cmd = cmd
        self._save_current_prefs()  # Save alias preference
        self.runner.run(cmd)

    def copy_last_cmd(self):
        if not self.last_cmd:
            messagebox.showinfo("No command", "Run something first.")
            return
        self.clipboard_clear()
        self.clipboard_append(self.last_cmd)
        messagebox.showinfo("Copied", f"Copied:\n{self.last_cmd}")

    def open_live(self):
        # עדכן אם ה-production שלך על דומיין אחר
        webbrowser.open("https://fireclassstudio.web.app")

    # --------------- Git ---------------
    def git_status(self):
        self.last_cmd = "git status"
        self.runner.run(self.last_cmd)

    def git_pull(self):
        self.last_cmd = "git pull --rebase"
        self.runner.run(self.last_cmd)

    def git_acp(self):
        branch = self.branch_var.get().strip() or "main"
        msg = self.msg_var.get().strip() or "update"
        force = " --force" if self.force_push.get() else ""
        # ריצה סדרתית: add, commit, push
        cmd = f"git add -A && git commit -m {json.dumps(msg)} || echo 'nothing to commit' && git push -u origin {branch}{force}"
        self.last_cmd = cmd
        self._save_current_prefs()  # Save branch preference
        self.runner.run(cmd)

    def git_trigger_ci(self):
        branch = self.branch_var.get().strip() or "main"
        cmd = f"git commit --allow-empty -m 'chore: ci trigger' && git push -u origin {branch}"
        self.last_cmd = cmd
        self.runner.run(cmd)

    def open_repo(self):
        if self.repo_web:
            webbrowser.open(self.repo_web)
        else:
            messagebox.showinfo("Repo URL not found", "Couldn't detect origin URL. Configure git remote origin.")

    def open_actions(self):
        if self.repo_web:
            webbrowser.open(self.repo_web + "/actions")
        else:
            messagebox.showinfo("Repo URL not found", "Couldn't detect origin URL. Configure git remote origin.")


if __name__ == "__main__":
    app = App()
    app.mainloop()
