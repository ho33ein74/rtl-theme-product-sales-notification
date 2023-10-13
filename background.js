chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("rtl-theme-checker", {
        delayInMinutes: 10,
        periodInMinutes: 10
    });
});

// request only
const ORequest = async (url) => {

    let request = await fetch(`https://api.unixscript.ir/rtl-theme/checker.php?url=${url}`);

    request = await request.json();

    if (!request.hasOwnProperty('status') || !request.status)
        return null;

    return request.item;

}

// update
const Update = async () => {
    chrome.storage.local.get('urls', async (value) => {

        if (!value.hasOwnProperty('urls'))
            return null;

        let urls = JSON.parse(value.urls);

        let rows = [];

        await Promise.all(urls.map(async (item, index) => {
            if (item && item.hasOwnProperty('url')) {
                if (navigator.onLine) {
                    let request = await ORequest(item.url);

                    if (!request)
                        return null;

                    rows.push({
                        ...request,
                        url: item.url
                    })
                } else {
                    return null;
                }
            }
        }));

        rows.map((item, index) => {

            urls.map(old => {
                if (old.url === item.url) {
                    if (old.count !== item.count) {
                        chrome.notifications.create(`my-notification-${Date.now()}`, {
                            type: 'basic',
                            iconUrl: "img/new.png",
                            title: 'فروش جدید!',
                            contextMessage: item.name,
                            priority: 2,
                            message: ` فروش جدید: ${item.count - old.count}\nفروش کل: ${item.count}`
                        });
                    }
                }
            })

        })

        // Update
        if (rows.length === urls.length) {
            chrome.storage.local.set({'urls': JSON.stringify(rows)});
        }
    });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === "rtl-theme-checker") {
        Update();
    }
});

