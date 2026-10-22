"""Keep the legacy town music out of every casual game and honor casual mute."""
OLD="if(document.hidden||s.bgmOff){music.pause();return;}"
NEW="if(document.hidden||s.bgmOff||(window.GaiaCasual&&(window.GaiaCasual.run||!window.GaiaCasual.state.sound))){music.pause();return;}"
def patch_html(text):
    assert text.count(OLD)==1,'Expected exactly one legacy town BGM gate'
    return text.replace(OLD,NEW)
