window.addEventListener("load", function () {

    // request
    const Request = async (url) => {

        // set loading
        document.querySelector('button.create-url').textContent = 'در حال بررسی...';
        document.querySelector('button.create-url').setAttribute('disabled', true);

        let request = await fetch(`https://api.unixscript.ir/rtl-theme/checker.php?url=${url}`);

        // remove loading
        document.querySelector('button.create-url').textContent = 'ایجاد';
        document.querySelector('button.create-url').removeAttribute('disabled');

        request = await request.json();

        if (!request.hasOwnProperty('status')) {
            alert('عملیات با خطا روبرو شد.');
            return null;
        }

        if (!request.status) {
            alert(request.msg);
            return null;
        }

        return request.item;

    }

    // request only
    const ORequest = async (url) => {
        let request = await fetch(`https://api.unixscript.ir/rtl-theme/checker.php?url=${url}&type=check`);

        request = await request.json();

        if (!request.hasOwnProperty('status') || !request.status)
            return null;

        return request.item;
    }

    const Update = async () => {
        chrome.storage.local.get('urls', async (value) => {

            if (!value.hasOwnProperty('urls'))
                return null;

            let urls = JSON.parse(value.urls);

            let rows = [];

            if (navigator.onLine) {
                await Promise.all(urls.map(async (item, index) => {
                    if (item && item.hasOwnProperty('url')) {
                            let request = await ORequest(item.url);

                            if (!request)
                                return null;

                            rows.push({
                                ...request,
                                url: item.url
                            })
                    }
                }));
            } else {
                alert('ارتباط اینترنت شما قطع گردید!');
                return null;
            }

            rows.map((item, index) => {
                urls.map((old) => {
                    if (old.url === item.url) {
                        if (old.count !== item.count) {
                            chrome.notifications.create(`my-notification-${Date.now()}`, {
                                iconUrl: '../img/new.png',
                                type: "basic",
                                contextMessage: item.name,
                                priority: 2,
                                message: ` فروش جدید: ${item.count - old.count}\nفروش کل: ${item.count}`,
                                title: 'فروش جدید!'
                            }, function(context) {
                                console.log("Last error:", chrome.runtime.lastError);
                            });
                            new Audio('../audio/notification.mp3').play();
                        }
                    }
                });
            });

            // Update
            if (rows.length === urls.length) {
                chrome.storage.local.set({'urls': JSON.stringify(rows)});
                Compiler();
            }
        });
    }

    setInterval(Update, 10000);

    // add db
    document.querySelector('button.btn.btn-sm.btn-primary.create-url').addEventListener('click', () => {

        // get url
        const url = document.querySelector('input#url');

        chrome.storage.local.get('urls', async (value) => {

            let urls

            if (!value.hasOwnProperty('urls'))
                urls = [];
            else
                urls = JSON.parse(value.urls);

            // request
            Request(url.value).then(item => {

                if (!item)
                    return null;

                urls.push({
                    ...item,
                    'url': url.value,
                });

                // Update
                chrome.storage.local.set({'urls': JSON.stringify(urls)});

                // Close box
                document.querySelector('button.close').click();

                // Reset input
                url.value = '';

                Compiler();
            })
        })

    })

    // Change alerts time
    document.querySelector('select').addEventListener('change', (e) => {

        // Remove old alert
        chrome.alarms.clear('rtl-theme-checker');

        // add new time
        chrome.alarms.create("rtl-theme-checker", {
            delayInMinutes: parseInt(e.target.value),
            periodInMinutes: parseInt(e.target.value)
        });
    })

    // compile table
    const Compiler = () => {
        chrome.storage.local.get('urls', async (value) => {

            if (!value.hasOwnProperty('urls'))
                return null;

            let urls = JSON.parse(value.urls);

            let rows = [];

            urls.sort(function (a, b) {
                return a.count - b.count;
            }).reverse();

            urls.map((item, index) => {
                if (item && item.hasOwnProperty('url'))
                    rows.push(`<tr><td><img src="${item.image}" alt="${item.name}" width="24"></td><td class="text-start"><h2><a href="${item.url}" target="_blank">${item.name}</a></h2></td>
            <td><span>${parseInt(item.count).toLocaleString("en-US")}</span></td><td>
            <span type="button" class="badge small bg-danger remove" data-id="${index}">${'حذف'}</span></td></tr>`)
            });

            if (rows.length)
                document.querySelector('tbody').innerHTML = rows.join('')
            else
                document.querySelector('tbody').innerHTML = `<tr><td class="text-start" colspan="3">محصولی یافت نشد</td></tr>`;

            // remove
            document.querySelectorAll('span.remove').forEach(item => {
                item.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');

                    urls = urls.filter(function (value, index, arr) {
                        return index !== parseInt(id);
                    });

                    // Update
                    chrome.storage.local.set({'urls': JSON.stringify(urls)});

                    Compiler();
                })
            })
        })
    }
    Compiler();

    // select time
    chrome.alarms.get("rtl-theme-checker").then(r => {
        document.querySelector('select').value = r.periodInMinutes;
    })

});
