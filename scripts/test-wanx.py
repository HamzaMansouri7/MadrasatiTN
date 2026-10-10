import os
import sys
from dashscope import ImageSynthesis

# Replace with your API key once approved
API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_API_KEY_HERE")

def generate_image(prompt: str, output_file: str = "output.png"):
    print(f"Generating image with prompt: '{prompt}'...")
    response = ImageSynthesis.call(
        api_key=API_KEY,
        model="wanx2.1-t2i-turbo",
        prompt=prompt,
        n=1,
        size="1024*1024"
    )
    
    if response.status_code == 200:
        results = response.output.results
        if results:
            import urllib.request
            img_url = results[0].url
            urllib.request.urlretrieve(img_url, output_file)
            print(f"Success! Saved image to {output_file}")
            return output_file
    else:
        print(f"Error ({response.code}): {response.message}")
        return None

if __name__ == "__main__":
    prompt = sys.argv[1] if len(sys.argv) > 1 else "A high quality educational illustration of the water cycle for elementary school"
    generate_image(prompt)
