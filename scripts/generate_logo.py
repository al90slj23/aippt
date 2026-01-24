#!/usr/bin/env python3
"""
Generate logo and favicon using Gemini 3 Pro Image Preview API
"""
import os
import sys
import requests
import base64
from pathlib import Path

# API Configuration
API_BASE = "https://aihubmix.com/v1"
API_KEY = "sk-AaUR3ZN9nSvmZ0qzDeB3883fFe624403B99a068c3a88E133"
MODEL = "gemini-3-pro-image-preview"

def generate_image(prompt: str, aspect_ratio: str = "1:1", resolution: str = "2K") -> bytes:
    """
    Generate image using Gemini 3 Pro Image Preview API (AIHubMix format)
    
    Args:
        prompt: Text description for image generation
        aspect_ratio: Image aspect ratio (1:1, 16:9, etc.)
        resolution: Image resolution (1K, 2K, 4K)
    
    Returns:
        Image data as bytes
    """
    url = f"{API_BASE}/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # AIHubMix uses Gemini native format with OpenAI-compatible wrapper
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "stream": False,
        "size": resolution,  # 1K, 2K, 4K
        "aspect_ratio": aspect_ratio  # Custom parameter for Gemini
    }
    
    print(f"🎨 Generating image with prompt: {prompt[:100]}...")
    print(f"   Aspect ratio: {aspect_ratio}, Resolution: {resolution}")
    
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(f"   Response: {response.text}")
        raise Exception(f"API request failed: {response.status_code}")
    
    result = response.json()
    
    # Extract image from Gemini response format
    if "choices" in result and len(result["choices"]) > 0:
        choice = result["choices"][0]
        message = choice.get("message", {})
        
        # Check multi_mod_content for image data
        multi_mod_content = message.get("multi_mod_content", [])
        for content_item in multi_mod_content:
            inline_data = content_item.get("inlineData", {})
            if "data" in inline_data:
                # Base64 encoded image
                return base64.b64decode(inline_data["data"])
    
    raise Exception(f"No image data in response: {result}")


def save_image(image_data: bytes, output_path: str):
    """Save image data to file"""
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(image_data)
    print(f"✅ Saved: {output_path}")


def resize_image(input_path: str, output_path: str, size: tuple):
    """Resize image using PIL"""
    try:
        from PIL import Image
        
        img = Image.open(input_path)
        img = img.resize(size, Image.Resampling.LANCZOS)
        img.save(output_path, optimize=True, quality=95)
        print(f"✅ Resized to {size[0]}x{size[1]}: {output_path}")
    except ImportError:
        print("⚠️  PIL not available, skipping resize. Install with: pip install Pillow")


def main():
    """Main function to generate all logo and favicon files"""
    
    # Project root directory
    project_root = Path(__file__).parent.parent
    public_dir = project_root / "frontend" / "public"
    
    print("🍌 Banana Slides Logo Generator")
    print("=" * 60)
    
    # Logo prompt - modern, professional, PPT/presentation focused
    logo_prompt = """
    Create a modern, minimalist logo for "元愈PPT" (YuanYu PPT):
    - A professional AI-powered presentation generation tool
    - Main element: Abstract geometric shapes representing presentation slides or documents
    - Design concept: Overlapping slides, layered rectangles, or a stylized play button
    - Color scheme: Vibrant gradient from yellow (#FCD34D) to orange (#F59E0B) with blue accents (#3B82F6)
    - Style: Clean, modern, tech-forward, professional, geometric
    - Include subtle AI/tech elements like: neural network nodes, circuit patterns, or flowing data lines
    - Background: Transparent or white
    - The design should be simple enough to work at small sizes (favicon)
    - Vector-style appearance with smooth gradients
    - Convey: Innovation, efficiency, intelligence, creativity
    """
    
    # Favicon prompt - simpler version for small sizes
    favicon_prompt = """
    Create a simple, iconic favicon for "元愈PPT":
    - A minimalist geometric icon representing presentation slides
    - Design: Simple overlapping rectangles or a play button shape
    - Color: Vibrant gradient from yellow (#FCD34D) to orange (#F59E0B)
    - Style: Very simple, clean, bold, recognizable at 16x16 pixels
    - High contrast for visibility at small sizes
    - Background: Transparent or white
    - The design should be instantly recognizable as a presentation tool
    """
    
    try:
        # Generate main logo (512x512)
        print("\n📦 Generating main logo (512x512)...")
        logo_data = generate_image(logo_prompt, aspect_ratio="1:1", resolution="2K")
        logo_path = public_dir / "logo.png"
        save_image(logo_data, str(logo_path))
        
        # Generate favicon base (512x512)
        print("\n📦 Generating favicon base (512x512)...")
        favicon_data = generate_image(favicon_prompt, aspect_ratio="1:1", resolution="2K")
        favicon_base_path = public_dir / "favicon-512x512.png"
        save_image(favicon_data, str(favicon_base_path))
        
        # Try to resize for different favicon sizes
        print("\n🔄 Creating different favicon sizes...")
        try:
            from PIL import Image
            
            sizes = [
                (16, 16, "favicon-16x16.png"),
                (32, 32, "favicon-32x32.png"),
                (192, 192, "favicon-192x192.png"),
                (180, 180, "apple-touch-icon.png"),
            ]
            
            for width, height, filename in sizes:
                output_path = public_dir / filename
                resize_image(str(favicon_base_path), str(output_path), (width, height))
        
        except ImportError:
            print("\n⚠️  Pillow not installed. Please install it to generate all favicon sizes:")
            print("   pip install Pillow")
            print("\n   Or use an online tool like https://favicon.io/ to resize the images.")
        
        print("\n" + "=" * 60)
        print("✨ Logo generation complete!")
        print(f"\n📁 Files saved to: {public_dir}")
        print("\n📝 Next steps:")
        print("   1. Check the generated images in frontend/public/")
        print("   2. If you need to regenerate, just run this script again")
        print("   3. Update frontend/index.html to reference the new favicon files")
        print("   4. Rebuild the frontend: cd frontend && npm run build")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
