document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("settings").onclick = () => {
        chrome.tabs.create({'url': chrome.runtime.getURL("options.html") } )
    };

    const manifest = chrome.runtime.getManifest();
    const pluginName = manifest.name;
    const pluginVersion = manifest.version;

    document.getElementById("pluginTitle").innerHTML = pluginName + " " + pluginVersion;
});