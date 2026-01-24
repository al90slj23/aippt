#!/usr/bin/env python3
"""
Generate logo and favicon using Imagen 4.0 Ultra (Google's flagship image model)
"""
import os
import sys
import requests
import base64
import time
from pathlib import Path

# API Configuration
API_BASE = "https://aihubmix.com/v1"
API_KEY = "sk-AaUR3ZN9nSvmZ0qzDeB3883fFe624403B99a068c3a88E133"
# Using Imagen 4.0 Ultra - Google's best image generation model
MODEL = "imagen-4.0-ultra-generate-001"

def generate_image(prompt: str, aspect_ratio: str = "1:1") -> bytes:
    """
    Generate image using Imagen 4.0 Ultra
    
    Args:
        prompt: Text description for image generation
        aspect_ratio: Image aspect ratio (1:1, 16:9, etc.)
    
    Returns:
        Image data as bytes
    """
    # Imagen uses OpenAI-compatible endpoint
    url = f"{API_BASE}/images/generations"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Imagen format (OpenAI-compatible)
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",  # Imagen supports standard sizes
        "response_format": "b64_json"
    }
    
    print(f"🎨 Generating image with Imagen 4.0 Ultra...")
    print(f"   Prompt: {prompt[:100]}...")
    print(f"   Model: {MODEL}")
    
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    
    if response.status_code != 200:
        print(f"❌ Error: {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        raise Exception(f"API request failed: {response.status_code}")
    
    result = response.json()
    
    # Standard OpenAI response format
    if "data" in result and len(result["data"]) > 0:
        first_item = result["data"][0]
        
        if "b64_json" in first_item:
            image_data = base64.b64decode(first_item["b64_json"])
            print(f"✅ Received image data: {len(image_data)} bytes")
            return image_data
        elif "url" in first_item:
            print(f"   Downloading from URL...")
            time.sleep(1)
            img_response = requests.get(first_item["url"], timeout=60)
            if img_response.status_code == 200:
                print(f"✅ Downloaded image data: {len(img_response.content)} bytes")
                return img_response.content
    
    print(f"❌ No image data found in response")
    raise Exception("No image data in response")


def generate_dalle3(prompt: str) -> bytes:
    """Fallback to DALL-E 3"""
    url = f"{API_BASE}/images/generations"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "quality": "standard",
        "response_format": "b64_json"
    }
    
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    if response.status_code != 200:
        raise Exception(f"DALL-E 3 also failed: {response.status_code}")
    
    result = response.json()
    if "data" in result and len(result["data"]) > 0:
        first_item = result["data"][0]
        if "b64_json" in first_item:
            return base64.b64decode(first_item["b64_json"])
        elif "url" in first_item:
            img_response = requests.get(first_item["url"], timeout=60)
            return img_response.content
    raise Exception("No image data from DALL-E 3")


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
    # 使用项目主题色：黄色/金色/橙色渐变 (#FFD700, #FFC700, #FCD34D, #F59E0B)
    logo_prompt = """Modern minimalist logo design for AI presentation tool. 
    Geometric abstract shape with overlapping rectangles representing slides. 
    Vibrant yellow to orange gradient colors (#FFD700 to #F59E0B). 
    Warm, energetic, and professional aesthetic. 
    Simple icon suitable for app logo. White or transparent background. 
    Vector style, flat design, modern SaaS product branding. 
    Convey: creativity, innovation, presentations, AI-powered."""
    
    # Favicon prompt - simpler version for small sizes
    favicon_prompt = """Simple geometric icon logo. 
    Abstract overlapping rectangles in golden yellow gradient. 
    Bright yellow to orange colors (#FFD700 to #F59E0B). 
    Minimalist flat design. Clean and bold. 
    Perfect for small sizes and favicon. 
    White background. Modern tech style. Warm and energetic."""
    
    try:
        # Generate main logo
        print("\n📦 Generating main logo with Imagen 4.0 Ultra...")
        try:
            logo_data = generate_image(logo_prompt)
            logo_path = public_dir / "logo.png"
            save_image(logo_data, str(logo_path))
        except Exception as e:
            print(f"⚠️  Imagen 4.0 Ultra failed: {e}")
            print("   Falling back to DALL-E 3...")
            logo_data = generate_dalle3(logo_prompt)
            logo_path = public_dir / "logo.png"
            save_image(logo_data, str(logo_path))
        
        # Generate favicon base
        print("\n📦 Generating favicon base...")
        try:
            favicon_data = generate_image(favicon_prompt)
            favicon_base_path = public_dir / "favicon-512x512.png"
            save_image(favicon_data, str(favicon_base_path))
        except Exception as e:
            print(f"⚠️  Imagen 4.0 Ultra failed: {e}")
            print("   Falling back to DALL-E 3...")
            favicon_data = generate_dalle3(favicon_prompt)
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
