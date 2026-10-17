"""Build the standalone, offline water mission. Also imported by the center builder."""
from pathlib import Path
HERE=Path(__file__).resolve().parent
ROOT=HERE.parents[2]
def document():
    js=(HERE/'game.js').read_text().replace('</script','<\\/script')
    css=(HERE/'style.css').read_text()
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>물병 채우기 · Wellness RPG</title><style>'+css+'</style></head><body><main id="game"></main><script>'+js+'</script><script>window.waterGame=WaterBottles.mount(document.querySelector("#game"),{onFinish(r){/*HOST_CALLBACK*/}});</script></body></html>'
if __name__=='__main__':
    out=ROOT/'tests/water-bottles.html';out.parent.mkdir(exist_ok=True);out.write_text(document());print(out)
