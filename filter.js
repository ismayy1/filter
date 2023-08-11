const query2 = [
    `demo`,
    `"complete sentence"`,
    `!demo2`,
    `!"excluded phrase"`,
    `filename:"file.pdf"`,
    `bucket:!"bucket-name"`
];

//const inputText = `user manual of the "demo application" filename:"file.pdf" bucket:!"bucket-name"`;
const inputText = `Doppelnippel "Bevor die Rücklauftemperaturanhebung zusammen" filename:"assets/Oxomi/WOLF/HeiztechnikBiomasse/3040043_200109.pdf" bucket:!"bucket-name"`;

const stopWords = ['of', 'the', 'it', 'and', 'und', 'a'];

const regex = /"[^"]+"|\S+/igu;
const parsedInput = inputText.match(regex);

// file type filtering
// const fileType = ['.pdf', '.txt', '.doc', '.docx', '.xls', '.xlsx', '.svg']

if (parsedInput) {
    const query = parsedInput.filter((word) => !stopWords.includes(word.toLowerCase()));

    const queriesWithoutMeta = query.filter((q) => !q.includes(':'));
    const queriesWithMeta = query.filter((q) => q.includes(':'));

    console.log(query);

    console.log(queriesWithoutMeta);
    console.log(queriesWithMeta);

// split queriesWithMeta by ':'
    const queriesWithMetaSplit = queriesWithMeta.map((q) => q.split(':'));
    console.log(queriesWithMetaSplit);

    const filter = [`SEARCH\n`];

    const bindVars = {};

    const queriesThatIncludes = queriesWithoutMeta.filter((q) => !q.startsWith('!'));
    for (const item in queriesThatIncludes) {
        filter.push(`PHRASE(doc.page_content, @bindVarInclude${item}, "text_en")`);
        if (item < queriesThatIncludes.length - 1) {
            filter.push('AND\n');
        }

        const bindVarInclude = `bindVarInclude${item}`;
    }

    const queriesThatExcludes = queriesWithoutMeta.filter((q) => q.startsWith('!'));
    for (const item in queriesThatExcludes) {
        if (queriesThatIncludes.length > 0) {
            filter.push('AND\n');
        }
        filter.push(`NOT PHRASE(doc.page_content, @bindVarExclude${item}, "text_en")`);

        const bindVarExclude = `bindVarExclude${item.filter((q) => !q.startsWith('!'))}`;
    }

    if (queriesWithMetaSplit.length > 0) {
        filter.push('\nFILTER\n');
        for (const item in queriesWithMetaSplit) {
            const [meta, value] = queriesWithMetaSplit[item];

            if (value.startsWith('!')) {
                filter.push(`doc.metadata.${meta} != @bindVarMeta${item}`);
            } else {
                filter.push(`doc.metadata.${meta} == @bindVarMeta${item}`);
            }
            if (item < queriesWithMetaSplit.length - 1) {
                filter.push('AND\n');
            }

            const bindVarMeta = `bindVarMeta${item}`;
        }
    }

    filter.push(`doc.metadata.${bindVars}`)

    const aqlFilter = filter.join(' ');
    console.log(aqlFilter);
}