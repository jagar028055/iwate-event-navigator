#!/usr/bin/env python3
"""
Simple icon generator for PWA icons
Creates solid color icons with text for web app
"""

import os
from io import BytesIO

# Create a simple HTML file that can be converted to PNG
def create_icon_html(size, color="#0d9488", text="岩"):
    return f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ margin: 0; padding: 0; }}
        .icon {{ 
            width: {size}px; 
            height: {size}px; 
            background: {color}; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            border-radius: 20%;
        }}
        .text {{ 
            color: white; 
            font-family: Arial, sans-serif; 
            font-size: {size//3}px; 
            font-weight: bold;
        }}
    </style>
</head>
<body>
    <div class="icon">
        <div class="text">{text}</div>
    </div>
</body>
</html>
"""

# Create simple placeholder icons
sizes = [72, 96, 128, 144, 152, 192, 384, 512]
icons_dir = "public/icons"

os.makedirs(icons_dir, exist_ok=True)

# Create a simple text-based icon file (fallback)
for size in sizes:
    icon_path = f"{icons_dir}/icon-{size}.png"
    
    # Create a simple text file as placeholder (browsers can handle missing icons)
    html_content = create_icon_html(size)
    html_path = f"{icons_dir}/icon-{size}.html"
    
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Created {html_path}")

print("Icon generation completed!")
print("Note: For production, convert HTML files to PNG using headless browser or image tool")