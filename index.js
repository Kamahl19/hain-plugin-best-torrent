const torrentzApi = require('./torrentz-api');

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

        torrentzApi.searchTorrent(query).then((torrents) => {
            res.remove('__temp');

            const results = torrents.map((t) => ({
                id: t.hash,
                payload: t.hash,
                title: t.title,
                desc: `<b>Rating:</b> <span style="background-color: ${t.ratingColor}; padding: 3px; color: #fff">${t.rating}</span> | <b>S:</b> ${t.seeds} | <b>P:</b> ${t.peers} | <b>Size:</b> ${t.size}`,
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
