import tkinter as tk
from tkinter import filedialog
import json
import os
import subprocess

def get_claude_config_path():
    """מוצא את נתיב קובץ ההגדרות של Claude Desktop"""
    home = os.path.expanduser("~")
    config_path = os.path.join(home, "AppData", "Roaming", "Claude", "claude_desktop_config.json")
    return config_path

def select_folder():
    """Opens folder selection dialog"""
    root = tk.Tk()
    root.withdraw()  # Hide main window
    
    folder_path = filedialog.askdirectory(
        title="Select folder for Claude Desktop",
        initialdir=os.path.expanduser("~")
    )
    
    root.destroy()
    return folder_path

def update_claude_config(folder_path):
    """Updates Claude Desktop configuration file"""
    config_path = get_claude_config_path()
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    # New configuration
    config = {
        "mcpServers": {
            "filesystem": {
                "command": "npx",
                "args": [
                    "@modelcontextprotocol/server-filesystem",
                    folder_path
                ]
            }
        }
    }
    
    try:
        # Save configuration file
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        
        print(f"Configuration file updated: {config_path}")
        print(f"Folder: {folder_path}")
        return True
        
    except Exception as e:
        print(f"Error updating configuration file: {e}")
        return False

def launch_claude():
    """Launches Claude Desktop"""
    try:
        username = os.getenv('USERNAME')
        possible_paths = [
            r"C:\Users\Meir Livneh\AppData\Local\AnthropicClaude\app-0.12.112\claude.exe",
            rf"C:\Users\{username}\AppData\Local\AnthropicClaude\app-0.12.112\claude.exe",
            rf"C:\Users\{username}\AppData\Local\Claude\Claude.exe",
            rf"C:\Users\{username}\AppData\Local\Programs\Claude\Claude.exe",
            r"C:\Program Files\Claude\Claude.exe",
            r"C:\Program Files (x86)\Claude\Claude.exe",
        ]
        
        claude_path = None
        for path in possible_paths:
            if os.path.exists(path):
                claude_path = path
                break
        
        if claude_path:
            print(f"Launching Claude Desktop from: {claude_path}")
            subprocess.Popen([claude_path])
            return True
        else:
            print("Claude Desktop not found in common locations")
            print("Try starting it manually")
            return False
            
    except Exception as e:
        print(f"Error launching Claude Desktop: {e}")
        return False

def main():
    print("Claude Desktop Project Launcher")
    print("=" * 40)
    
    # Select folder
    print("Select folder to work with Claude...")
    folder_path = select_folder()
    
    if not folder_path:
        print("No folder selected. Exiting.")
        return
    
    print(f"Selected folder: {folder_path}")
    
    # Update configuration
    if update_claude_config(folder_path):
        print("Waiting 2 seconds before launching Claude...")
        import time
        time.sleep(2)
        
        # Launch Claude Desktop
#       if launch_claude():
#           print("Completed successfully!")
#            print("\nInstructions:")
#            print("1. Claude Desktop should open now")
#            print("2. If it didn't open, launch it manually")
#            print("3. I now have access to all files in the selected folder")
#       else:
#            print("Configuration updated, but you'll need to launch Claude Desktop manually")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()