// Notion APIクライアントを初期化する
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// 設定ファイルを読み込む
dotenv.config({path: "./secret/.env"});

// APIクライアント
const notion = new Client({ auth: process.env.NOTION_API_KEY });

const {
    masterDbId,
    blockManagerDbId,
    getDbTitle,
} = require('./secret/databases-info.js');

const createNewDatabase = async(targetPageId, dbTitle, properties) => {
    let propertiesToAdd = {};
    let propertiesAdded = {};
    // まずはformulaを持たないプロパティを追加する
    Object.entries(properties).forEach(([key, value]) => {
        if (value.formula === undefined) {
            propertiesToAdd[key] = value;
            //propertiesAdded[key] = true;
        }
    });
    //console.debug('propertiesToAdd: ', propertiesToAdd);
    const res = await notion.databases.create({
        parent: {
            type: 'page_id',
            page_id: targetPageId,
        },
        is_inline: true,
        title: [{
            type: 'text',
            text: {
                content: dbTitle,
            },
        }],
        properties: propertiesToAdd,
    });
    const tableId = res.id;
    Object.keys(propertiesToAdd).forEach(key => {
        propertiesAdded[key] = true;
    });

    numLoops = 0;
    while (true) {
        // 追加済みのプロパティに対する formula を持つプロパティを追加する
        numLoops++;
        console.debug('numLoops: ', numLoops);
        propertiesToAdd = {};
        Object.entries(properties).forEach(([key, value]) => {
            if (propertiesAdded[key]) return;
            let allPropsReady = true;
            for (match of value.formula.expression.matchAll(/prop\("(.+?)"\)/g)) {
                // 依存しているプロパティを全て取得する
                const prop = match[1];
                if (! propertiesAdded[prop]) {
                    allPropsReady = false;
                    break;
                }
            }
            //if (key == '年齢') return;
            if (allPropsReady) {
                propertiesToAdd[key] = value;
                //propertiesAdded[key] = true;
            }
        });

        console.debug('# of propertiesToAdd: ', Object.keys(propertiesToAdd).length);
        // 追加するべきプロパティが無ければループ修了
        if (Object.keys(propertiesToAdd).length === 0) break;
        // プロパティを追加する
        const res = await notion.databases.update({
            database_id: tableId,
            properties: propertiesToAdd,
        });
        //console.debug('res: ', res);
        Object.keys(propertiesToAdd).forEach(key => {
            propertiesAdded[key] = true;
        });
    }
}

const main = async() => {
    const res = await notion.databases.retrieve({
        database_id: masterDbId,
    });
    //console.debug('res: ', res);
    const properties = res.properties;
    //console.debug('properties: ', properties);

    const res2 = await notion.databases.query({
        database_id: blockManagerDbId,
        sorts: [
            {
                property: '表示順位',
                direction: 'ascending',
            }
        ]
    });
    //console.debug('res2: ', res2);
    //console.debug('keys: ', Object.keys(res2));
    const pages = res2.results;
    //console.debug('pages: ', pages);

    let pageCount = 0;
    for (const page of pages) {
        pageCount++;
        if (pageCount > 1) break; // デバッグ
        console.debug('-----');
        console.debug('pageCount: ', pageCount);
        //console.debug('page: ', page);
        const targetPageId = page.id;
        const pageProperties = page.properties;
        //console.debug('properties: ', pageProperties);
        console.debug('担当者: ', pageProperties['担当者']);
        const dbTitle = getDbTitle(pageProperties);
        await createNewDatabase(targetPageId, dbTitle, properties);
    }
}
main();
