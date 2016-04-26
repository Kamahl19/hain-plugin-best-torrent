const got = require('got');
const $ = require('cheerio');

function composeUrl(q, opts) {
    let url = 'https://www.torrentz.eu/';

    url += (opts.quality === 'any') ? 'any' : '';
    url += (opts.quality === 'good') ? 'search' : '';
    url += (opts.quality === 'verified') ? 'verified' : '';
    url += (opts.orderBy === 'peers') ? 'P' : '';
    url += (opts.orderBy === 'rating') ? 'N' : '';
    url += (opts.orderBy === 'date') ? 'A' : '';
    url += (opts.orderBy === 'size') ? 'S' : '';

    const query = `${q} ${(opts.onlyKnownGroups) ? 'eztv | ettv | rarbg | YIFY' : ''} ${(opts.excludePoorQuality) ? '-CAM -CAMRip -TS -TELESYNC -PDVD -WP -WORKPRINT -TC -TELECINE' : ''}`;

    url += `?q=${encodeURIComponent(query)}`;

    return url;
}

function searchTorrent(query) {
    const opts = {
        onlyKnownGroups: false,
        excludePoorQuality: true,
        orderBy: 'rating',
        quality: 'good',
    };

    const url = composeUrl(query, opts);

    return got(url).then((res) => {
        const results = $('div.results', res.body);
        const items = $('dl', results);

        return items.map((idx, item) => {
            if (!$('a', item).text()) {
                return;
            }

            return {
                title: $('a', item).text(),
                hash: $('a', item).attr('href').substr(1),
                rating: $('span.v', item).text(),
                size: $('span.s', item).text(),
                seeds: $('span.u', item).text(),
                peers: $('span.d', item).text(),
            };
        }).get();
    });
}

function getRatingColor(rating) {
    switch (rating) {
        case '6':
            return '#79CC53';
        case '5':
            return '#93D177';
        case '4':
            return '#A3DB8A';
        case '3':
            return '#C0EAAD';
        case '2':
            return '#E5C877';
        case '1':
            return '#DD9658';
        case '0':
            return '#D64D4A';
        default:
            return '#000';
    }
}

module.exports = (pluginContext) => {
    const shell = pluginContext.shell;
    const logger = pluginContext.logger;
    const toast = pluginContext.toast;

    function search(q, res) {
        const query = q.trim();

        if (query.length <= 0) {
            res.add({
                title: 'Please enter search query',
                desc: 'hain-plugin-best-torrent'
            });

            return;
        }

        res.add({
            id: '__temp',
            title: 'Searching …',
            icon: '#fa fa-circle-o-notch fa-spin',
        });

        searchTorrent(query).then((torrents) => {
            res.remove('__temp');

            const results = torrents.map((t) => ({
                id: t.hash,
                payload: t.hash,
                title: t.title,
                desc: `<b>Rating:</b> <span style="background-color: ${getRatingColor(t.rating)}; padding: 3px; color: #fff">${t.rating}</span> | <b>S:</b> ${t.seeds} | <b>P:</b> ${t.peers} | <b>Size:</b> ${t.size}`,
            }));

            res.add(results);

            if (!results.length) {
                res.add({
                    id: 'error',
                    title: 'No torrents found',
                    desc: `<b>Query:</b> ${query}`,
                    icon: '#fa fa-close',
                });
            }
        }).catch((err) => {
            toast.enqueue('We are sorry but there has been an error while searching for the best torrent', 3500);

            logger.log(err);
        });
    }

    function execute(id, payload) {
        if (payload) {
            shell.openExternal(`https://www.torrentz.eu/${payload}`);
        }
    }

    return { search, execute };
};
