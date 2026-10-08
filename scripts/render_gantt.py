import subprocess, os
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
html = os.path.abspath("diagrams/gantt_chart_professional.html")
png = os.path.abspath("diagrams/gantt_chart_professional.png")
file_url = "file:///" + html.replace("\\", "/")
cmd = [
    chrome,
    "--headless=new",
    f"--screenshot={png}",
    "--window-size=1200,480",
    "--force-device-scale-factor=2",
    file_url
]
subprocess.run(cmd, check=True)
print("Rendered gantt PNG size:", os.path.getsize(png))
