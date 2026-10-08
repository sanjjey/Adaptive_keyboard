import subprocess
import os

chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
html_files = [
    ("diagrams/fig2_1_literature_taxonomy.html", "diagrams/fig2_1_literature_taxonomy.png", 1150, 720),
    ("diagrams/fig3_1_workflow_architecture.html", "diagrams/fig3_1_workflow_architecture.png", 1200, 760),
    ("diagrams/fig3_2_voronoi_tessellation.html", "diagrams/fig3_2_voronoi_tessellation.png", 1150, 680),
    ("diagrams/fig3_3_backspace_penalty.html", "diagrams/fig3_3_backspace_penalty.png", 1150, 680),
    ("diagrams/fig4_1_hardware_enclosures.html", "diagrams/fig4_1_hardware_enclosures.png", 1150, 680),
    ("diagrams/fig4_2_performance_benchmark.html", "diagrams/fig4_2_performance_benchmark.png", 1150, 680),
]

for html, png, w, h in html_files:
    abs_html = os.path.abspath(html)
    abs_png = os.path.abspath(png)
    cmd = [
        chrome,
        "--headless=new",
        f"--screenshot={abs_png}",
        f"--window-size={w},{h}",
        "--force-device-scale-factor=2",
        f"file:///{abs_html.replace(os.sep, '/')}"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(abs_png) and os.path.getsize(abs_png) > 1000:
        print(f"Rendered {png} ({os.path.getsize(abs_png)} bytes)")
    else:
        print(f"Failed {png}: {res.stderr}")
