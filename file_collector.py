import os
import glob
from pathlib import Path

def collect_files_to_txt(source_directory, output_file="collected_files.txt"):
    """
    Collects all HTML, JS, JSON, MD files from specific folders (public, function, docs) and their subdirectories
    
    Args:
        source_directory (str): Path to the source directory
        output_file (str): Name of the output file
    """
    
    # File extensions to collect
    file_extensions = ['*.html', '*.js', '*.json', '*.md']
    
    # Specific folders to search in
    target_folders = ['public', 'function', 'docs']
    
    # Open output file for writing
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write("=" * 80 + "\n")
        outfile.write("COLLECTED FILES\n")
        outfile.write(f"From directory: {os.path.abspath(source_directory)}\n")
        outfile.write(f"Target folders: {', '.join(target_folders)}\n")
        outfile.write("=" * 80 + "\n\n")
        
        files_found = 0
        folders_found = []
        
        # Search in each target folder
        for folder_name in target_folders:
            folder_path = os.path.join(source_directory, folder_name)
            
            # Check if folder exists
            if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
                print(f"Warning: Folder '{folder_name}' not found in {source_directory}")
                continue
            
            folders_found.append(folder_name)
            print(f"Searching in folder: {folder_path}")
            
            # Collect files by extension from this folder
            for extension in file_extensions:
                # Recursive search in this folder and its subdirectories
                pattern = os.path.join(folder_path, "**", extension)
                files = glob.glob(pattern, recursive=True)
                
                for file_path in sorted(files):
                    try:
                        # Read file content
                        with open(file_path, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                        
                        # Create header with full path
                        outfile.write("\n" + "=" * 120 + "\n")
                        outfile.write(f"FILE: {os.path.abspath(file_path)}\n")
                        outfile.write(f"TYPE: {Path(file_path).suffix}\n")
                        outfile.write(f"SIZE: {len(content)} characters\n")
                        outfile.write(f"FOLDER: {folder_name}\n")
                        outfile.write("=" * 120 + "\n\n")
                        
                        # Write file content
                        outfile.write(content)
                        outfile.write("\n\n")
                        
                        files_found += 1
                        print(f"Added: {file_path}")
                        
                    except Exception as e:
                        # Handle errors (unreadable files, encoding issues, etc.)
                        outfile.write("\n" + "=" * 120 + "\n")
                        outfile.write(f"FILE: {os.path.abspath(file_path)}\n")
                        outfile.write(f"ERROR reading file: {str(e)}\n")
                        outfile.write(f"FOLDER: {folder_name}\n")
                        outfile.write("=" * 120 + "\n\n")
                        print(f"Error with file {file_path}: {str(e)}")
        
        # Summary at the end
        outfile.write("\n" + "=" * 80 + "\n")
        outfile.write(f"SUMMARY: {files_found} files added\n")
        outfile.write(f"Folders searched: {', '.join(folders_found)}\n")
        outfile.write("=" * 80 + "\n")
    
    print(f"\nCompleted! Created file: {output_file}")
    print(f"Total files: {files_found}")
    print(f"Folders found: {', '.join(folders_found) if folders_found else 'None'}")

def main():
    """Main function to run the script"""
    
    # Set source directory (current directory as default)
    source_dir = input("Enter directory path (or Enter for current directory): ").strip()
    if not source_dir:
        source_dir = "."
    
    # Check if directory exists
    if not os.path.exists(source_dir):
        print(f"Error: Directory {source_dir} does not exist")
        return
    
    # Set output filename
    output_filename = input("Enter output filename (or Enter for default 'collected_files.txt'): ").strip()
    if not output_filename:
        output_filename = "collected_files.txt"
    
    print(f"\nStarting file collection from: {os.path.abspath(source_dir)}")
    print("Looking for files: .html, .js, .json, .md")
    print("-" * 50)
    
    # Run the function
    collect_files_to_txt(source_dir, output_filename)

if __name__ == "__main__":
    main()