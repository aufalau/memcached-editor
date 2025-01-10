import base64

filename = "del"
for filename in ["sync", "del", "edit", "save", "search"]:
    # Read the SVG file
    with open(f"{filename}.svg", "rb") as svg_file:
        svg_data = svg_file.read()

    # Encode to Base64
    encoded_svg = base64.b64encode(svg_data).decode('utf-8')

    # print(encoded_svg)

    with open(f"{filename}.txt", "w") as base64_file:
        base64_file.write(encoded_svg)
