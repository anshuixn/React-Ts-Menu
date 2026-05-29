import os
from PIL import Image

def convert_png_to_webp(directory):
    total_saved = 0
    png_count = 0
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.png'):
                png_path = os.path.join(root, file)
                webp_path = os.path.splitext(png_path)[0] + '.webp'
                
                try:
                    original_size = os.path.getsize(png_path)
                    
                    with Image.open(png_path) as img:
                        # Save as WebP
                        img.save(webp_path, 'WEBP', quality=80)
                        
                    compressed_size = os.path.getsize(webp_path)
                    saved = original_size - compressed_size
                    total_saved += saved
                    png_count += 1
                    
                    print(f"Converted: {file} -> {os.path.basename(webp_path)}")
                    print(f"  Size: {original_size / 1024:.1f} KB -> {compressed_size / 1024:.1f} KB (Saved {saved / 1024:.1f} KB)")
                    
                    # Remove original PNG
                    os.remove(png_path)
                except Exception as e:
                    print(f"Error converting {png_path}: {e}")
                    
    print(f"\nFinished converting {png_count} images.")
    print(f"Total space saved: {total_saved / (1024 * 1024):.2f} MB")

if __name__ == '__main__':
    menu_directory = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public', 'assets', 'menu')
    print(f"Scanning menu directory: {menu_directory}")
    convert_png_to_webp(menu_directory)
