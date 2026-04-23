from PIL import Image

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    for item in data:
        # Check if the pixel is white-ish (logo text and shape)
        # The fake transparent background is usually grey/dark grey blocks
        if item[0] > 220 and item[1] > 220 and item[2] > 220:
            new_data.append((255, 255, 255, item[3])) # keep white, keep alpha
        else:
            new_data.append((255, 255, 255, 0)) # make transparent
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Background removed successfully: {output_path}")

remove_background("public/logo.png", "public/logo_transparent.png")
