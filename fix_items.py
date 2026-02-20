
import os

file_path = 'src/data/all-avatar-items.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Check if we have enough lines
    if len(lines) < 190789:
        print(f"File is too short: {len(lines)} lines")
    else:
        # Keep only the valid lines (up to 190789)
        new_lines = lines[:190789]
        # Append the closing bracket
        new_lines.append('\n]')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
            
        print("Fixed src/data/all-avatar-items.json")
        
except Exception as e:
    print(f"Error: {e}")
