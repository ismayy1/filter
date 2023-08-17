const query2 = [
    `demo`,
    `"complete sentence"`,
    `!demo2`,
    `!"excluded phrase"`,
    `filename:"file.pdf"`,
    `bucket:!"bucket-name"`
];

// const inputText = `user manual of the "demo application" filename:"file.pdf" bucket:!"bucket-name"`;
// const inputText = `Doppelnippel "Bevor die Rücklauftemperaturanhebung zusammen" filename:"assets/Oxomi/WOLF/HeiztechnikBiomasse/3040043_200109.pdf" bucket:!"bucket-name" !demo`;
// const inputText = 'pla pokdkjh oiahkljds f olushdou kusbdkjbs of the and'
// const inputText = "bucket:public";
// const inputText = "dd"
const inputText = "!\"dd\""

const stopWords = ['of', 'the', 'it', 'and', 'und', 'a', '-'];

const regex = /"[^"]+"|\S+/igu;
const parsedInput = inputText.match(regex);

if (parsedInput) {

    const query = parsedInput.filter((word) => !stopWords.includes(word.toLowerCase()));
    const queriesWithoutMeta = query.filter(q => !q.includes(':'));
    const queriesWithMeta = query.filter(q => q.includes(':'));
    let filter = [`SEARCH\n`];
    const bindVars = {};
    // split queriesWithMeta by ':'
    const queriesWithMetaSplit = queriesWithMeta.map((q) => q.split(':'));

    //////
    let queriesThatIncludes;
    let queriesThatExcludes;

    if (queriesWithMeta.length === 0) {
        queriesThatIncludes = queriesWithoutMeta.filter((q) => !q.startsWith('!'));
        queriesThatExcludes = queriesWithoutMeta.filter((q) => q.startsWith('!'));
    } else {
        queriesThatIncludes = queriesWithoutMeta.filter((q) => !q.startsWith('!'));
        queriesThatExcludes = queriesWithoutMeta.filter((q) => q.startsWith('!'));

        const hasNonMetaParts = queriesWithoutMeta.length === 0;
        if (hasNonMetaParts) {
            filter.shift();
        }
    }
    //////

    // Handle Inclusion Conditions
    // const queriesThatIncludes = queriesWithoutMeta.filter((q) => !q.startsWith('!'));
    for (const item in queriesThatIncludes) {

        const bindVarInclude = `bindVarInclude${item}`;
        const bindVarIncludeValue = queriesThatIncludes[item]

        filter.push(`PHRASE(doc.page_content, @bindVarInclude${item}, "text_en")`);
        if (item < queriesThatIncludes.length) {
            filter.push('AND\n');
        }

        bindVars[bindVarInclude] = bindVarIncludeValue.replace(/^[!']|["']|['"]$/igu, '');
    }

    // Handle Exclusion Conditions
    // const queriesThatExcludes = queriesWithoutMeta.filter((q) => q.startsWith('!'));
    for (const item in queriesThatExcludes) {

        const bindVarExclude = `bindVarExclude${item}`;
        const bindVarExcludeValue = queriesThatExcludes[item]

        if (queriesThatIncludes.length > 0) {
            filter.push('AND\n');
        }

        filter.push(`NOT PHRASE(doc.page_content, @bindVarExclude${item}, "text_en")`);

        if (bindVarExcludeValue.startsWith('!')) {
            bindVars[bindVarExclude] = bindVarExcludeValue.replace(/^[!']|["']|['"]$/igu, '')
        } else {
            bindVars[bindVarExclude] = bindVarExcludeValue
        }
    }

    // Handle Meta Conditions
    if (queriesWithMetaSplit.length > 0) {
        filter.push('\nFILTER\n');


        for (const item in queriesWithMetaSplit) {
            const [meta, value] = queriesWithMetaSplit[item];
            const bindVarMeta = `bindVarMeta${item}`

            if (value.startsWith('!')) {
                filter.push(`doc.metadata.${meta} != @bindVarMeta${item}`);
            } else {
                filter.push(`doc.metadata.${meta} == @bindVarMeta${item}`);
            }

            if (item < queriesWithMetaSplit.length - 1) {
                filter.push('AND\n');
            }

            bindVars[bindVarMeta] = value.replace(/^[!']|["']|['"]$/igu, '')
            // console.log(meta)
            // console.log(filter)
        }
    }

    const aqlFilter = filter.join(' ');

    console.log(bindVars)
    console.log(aqlFilter);
}
