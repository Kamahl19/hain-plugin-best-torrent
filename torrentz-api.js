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

            const rating = $('span.v', item).text();

            return {
                title: $('a', item).text(),
                hash: $('a', item).attr('href').substr(1),
                rating,
                ratingColor: getRatingColor(rating),
                size: $('span.s', item).text(),
                seeds: $('span.u', item).text(),
                peers: $('span.d', item).text(),
            };
        }).get();
    });
}

exports.searchTorrent = searchTorrent;
