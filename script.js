// @todo day & hour lines - 6, 12, 18
// @todo show timezone hours onhover - americas, east-south asia, east asia, australia/new zealand
// @todo select categories to show/hide; option - refresh data domain (adjust y axis)
// @todo highlight category line on hover
// @todo crosshair with (date, viewers) info

async function fetchData(opts) {
    const {from, to, interval, filter} = opts;
    const res = await fetch(`http://localhost:3002/stats`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from,
            to,
            interval,
            filter,
        }),
    });
    return res.json();
}


// @todo left margin - start at min date
// @todo line
// @todo chart - show/hide individual categories
// @todo date format https://bl.ocks.org/d3noob/ccdcb7673cdb3a796e13
function drawChart(config, data, catNames, opts = {}, i = 0) {
    // const data = generateData(dataset.domain, 50, dataset.fn);
    const defaultGetDate = date => new Date(date);
    const getDate = opts.getDate || defaultGetDate;

    const dataArr = Object.entries(data).reduce((memo, [date, stats]) => {
        memo.push({date: getDate(date), stats});
        return memo;
    }, []);
    // console.log('dataArr', dataArr)
    const colors = catNames.reduce((memo, catName, i) => {
        const hue = 360 / catNames.length * i;
        memo[catName] = `hsl(${hue}, 50%, 50%)`;
        return memo;
    }, {});

    // const dates = Object.keys(data).sort();
    const xMin = dataArr[0].date;
    // const xMin = new Date('2020-10-16');
    const xMax = dataArr[dataArr.length - 1].date;
    // const xMax = new Date('2020-11-02');

    const yMax = dataArr.reduce((max, {stats}) => {
        const catMeans = Object.values(stats).map(({mean}) => mean);
        return Math.max(max, ...catMeans);
    }, -1);

    const containerWidth = 1400;
    const containerHeight = 500;

    const svgID = `chart_${i}`;
    // console.log(svgID, dataset.label, data);
    const datasetHtml = `<div>
    <p>${config.label}</p>

    <!--<table>
        <tr>
            <th>from</th>
            <th>to</th>
            <th>interval</th>
            <th>filter</th>
        </tr>

        <tr>
            <td>${config.dataConfig.from}</td>
            <td>${config.dataConfig.to}</td>
            <td>${config.dataConfig.interval}</td>
            <td style="background: lightgrey; font-family: monospace">${JSON.stringify(config.dataConfig.filter)}</td>
        </tr>
    </table>-->

    <div style="display: flex">
        <pre style="background-color: lightgrey;">${JSON.stringify(config.dataConfig, null, 2)}</pre>

        <ul>
            ${
                catNames.map(catName => {
                    return `<li><div style="display: inline-block; width: 1em; height: 1em; background-color: ${colors[catName]};"></div>${catName}</li>`
                }).join('')
            }
        </ul>

        <svg id="${svgID}" width="${containerWidth}" height="${containerHeight}" class="chart"></svg>
    </div>

</div>`;

    document.getElementById('app-root').innerHTML += datasetHtml;

    const container = d3.select(`#${svgID}`)
        .attr('width', containerWidth)
        .attr('height', containerHeight);

    const getDomain = (min, max, val) => {
        const size = max - min;
        const margin = size * val;
        return [min - margin, max + margin];
    };
    const xScale = d3.scaleTime().domain([xMin, xMax]).range([0, containerWidth]);
    const yScale = d3.scaleLinear().domain(getDomain(0, yMax, .25)).range([containerHeight, 0]);

    const xAxis = d3.axisBottom().scale(xScale);
    const yAxis = d3.axisLeft().scale(yScale);

    container
        .append('g')
        .attr('transform', `translate(0, ${yScale(0)})`)
        .call(xAxis)
        .selectAll("text")
        .attr("y", 0)
        .attr("x", 9)
        .attr("dy", ".35em")
        .attr("transform", "rotate(90)")
        .style("text-anchor", "start");

    container
        .append('g')
        // .attr('transform', `translate(${xScale(new Date('2020-10-18'))}, 0)`)
        .attr('transform', `translate(${xScale(dataArr[Math.floor(dataArr.length / 2)].date)}, 0)`)
        .call(yAxis);

    const xAttr = d => {
        return xScale(d.date);
    };

    // const bars = container
    //     .selectAll('.bar')
    //     .data(dataArr)
    //     .enter()
    //     .append('rect')
    //     .classed('bar', true)
    //     .attr('width', 1)
    //     .attr('height', d => containerHeight - yAttr(d))
    //     .attr('x', xAttr)
    //     .attr('y', yAttr)
    //     // .style('left', (x, i) => i * barWidth + 'px')
    //     .attr('fill', '#ddd')
    //     // .text(x => x)

    for (const catName of catNames) {
        const yAttr = d => {
            // console.log('d.stats', d.stats)
            if (!d.stats[catName]) return yScale(0);

            return yScale(d.stats[catName].mean);
        };

        // const catGroup = container
        //     .append('g');
        // const dots = catGroup
        //     .selectAll('.dot')
        //     .data(dataArr)
        //     .enter()
        //     .append('circle')
        //     .classed('dot', true)
        //     .attr('r', 1)
        //     .attr('cx', xAttr)
        //     .attr('cy', yAttr)
        //     // .style('left', (x, i) => i * barWidth + 'px')
        //     // .attr('fill', (x, i) => i % 2 ? 'silver' : 'grey')
        //     .attr('fill', (x, i) => colors[catName])
        // // .text(x => x)

        container.append("path")
            .datum(dataArr)
            .attr("fill", "none")
            .attr("stroke", colors[catName])
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(xAttr)
                .y(yAttr)
            );
    }
}

(async () => {
    const config = [
        {
            label: 'diablo I-III per day',
            dataConfig: {
                from: '2020-10-17',
                to: '2020-11-01',
                interval: 'day',
                filter: 'diablo',
            },
        },
        {
            label: 'diablo I-III per hour',
            dataConfig: {
                // from: '2020-10-30',
                from: '2020-10-17',
                to: '2020-11-01',
                interval: 'hour',
                filter: 'diablo',
            },
        },
        {
            label: 'recently popular',
            dataConfig: {
                // from: '2020-10-30',
                from: '2020-10-17',
                to: '2020-11-01',
                interval: 'hour',
                filter: ['just chatting', 'fall guys', 'among us', 'phasmophobia', 'grand theft auto', 'dead by daylight', 'torchlight', 'Genshin Impact', 'animal crossing', 'World of Warcraft'],
            },
        },
        {
            label: 'non-games',
            dataConfig: {
                // from: '2020-10-30',
                from: '2020-10-17',
                to: '2020-11-05',
                interval: 'hour',
                filter: [{exact: 'just chatting'}, {exact: 'music'}, {exact: 'art'}, {exact: 'sports'}, {exact: 'Talk Shows & Podcasts'}, {exact: 'Food & Drink'}, {exact: 'Science & Technology'}],
            },
        },
        {
            label: 'arpg',
            dataConfig: {
                // from: '2020-10-30',
                from: '2020-10-17',
                to: '2020-11-05',
                interval: 'hour',
                filter: ['diablo', 'Path of Exile', 'wolcen', 'torchlight', 'grim dawn'],
            },
        },
        {
            label: 'top "> 20k" 2020-11-02 18:16',
            dataConfig: {
                from: '2020-10-17',
                to: '2020-11-05',
                interval: 'hour',
                filter: [
                    {exact: 'Just Chatting'},
                    {exact: 'Counter-Strike: Global Offensive'},
                    {exact: 'League of Legends'},
                    {exact: 'Fortnite'},
                    {exact: 'Call Of Duty: Modern Warfare'},
                    {exact: 'Among Us'},
                    {exact: 'Minecraft'},
                    {exact: 'Grand Theft Auto V'},
                    {exact: 'Dota 2'},
                    {exact: 'World of Warcraft'},
                    {exact: 'VALORANT'},
                    {exact: 'FIFA 21'},
                    {exact: 'Escape From Tarkov'},
                    {exact: 'Hearthstone'},
                    {exact: 'Apex Legends'},
                    {exact: 'Old School RuneScape'},
                    {exact: 'Teamfight Tactics'},
                    {exact: 'Dead by Daylight'},
                    {exact: 'Tom Clancy\'s Rainbow Six: Siege'},
                    {exact: 'Phasmophobia'},
                    {exact: 'Genshin Impact'},
                    {exact: 'PLAYERUNKNOWN\'S BATTLEGROUNDS'},
                    {exact: 'Watch Dogs: Legion'},
                    {exact: 'Rocket League'},
                    {exact: 'Overwatch'},
                ]
            },
        },
    ];

    const getDateWithHours = date => new Date(date + ':00');

    for (const item of config) {
        const data = await fetchData(item.dataConfig);

        drawChart(item, data.data, Object.keys(data.ticks), {
            ...(item.dataConfig.interval === 'hour' && {getDate: getDateWithHours}),
        }, config.indexOf(item));
    }

})();