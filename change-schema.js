// Notion APIクライアントを初期化する
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

// 設定ファイルを読み込む
dotenv.config({path: "./secret/.env"});

// スキーマの変換マップ
// 
// プロパティ名を変更する場合
// '旧プロパティ名': { name: '新プロパティ名' }
//
// プロパティを追加する場合
// '追加プロパティ名': { schema_type: {} }
// (schema_typeの例: 'rich_text', 'date')
// 
// 参考URL
// https://developers.notion.com/reference/update-a-database#body-updateADatabase
// https://developers.notion.com/reference/property-schema-object
const convertProperties = {
    'シメイ': {
        name: 'ふりがな',
    },
    'メール': {
        name: 'E-mail',
    },
    '電話番号１': {
        name: '自宅電話',
    },
    '電話番号２': {
        name: '携帯電話',
    },
    'ＦＡＸ番号': {
        name: 'ＦＡＸ',
    },
    '会費（合計）': {
        name: '会費合計（自動計算）',
    },
    'E-mail (確認用)': {
        rich_text: {},
    },
    '予備１': {
        rich_text: {},
    },
    '予備２': {
        rich_text: {},
    },
    '予備３': {
        rich_text: {},
    },
    'データ移動': {
        date: {},
    },
}

/**
 * 表示名 -> DB ID のマップ
 * @type {[key: string]: string]}
 */
const dbIdMap = require('./secret/masters.json')

const notion = new Client({ auth: process.env.NOTION_API_KEY });

//console.debug('dbIdMap: ', dbIdMap);

// プロパティ変換マップから、旧プロパティ名の一覧を取得する
const getOldPropertyNames = () => {
    const oldNames = [];
    for (const [field, value] of Object.entries(convertProperties)) {
        if (value.name) {
            // 新プロパティ名が与えられているので、fieldは旧プロパティ名
            oldNames.push(field);
        }
    }
    return oldNames;
}

// プロパティ変換マップから、新プロパティ名の一覧を取得する
const getNewPropertyNames = () => {
    const newNames = [];
    for (const [field, value] of Object.entries(convertProperties)) {
        if (value.name) {
            // 新プロパティ名が与えられているので、value.nameは新プロパティ名
            newNames.push(value.name);
        } else {
            // 新プロパティ名が与えられていないので、fieldは新プロパティ名
            newNames.push(field);
        }
    }
    return newNames;
}

// properties (Object) に names (Array) が全て含まれているかどうかをチェックする
const checkPropertyNamesContained = (properties, names) => {
    for (const name of names) {
        if (!properties[name]) {
            return false;
        }
    }
    return true;
}


const main = async() => {
    let numDbs = 0;
    let numConverted = 0;
    const oldNames = getOldPropertyNames();
    const newNames = getNewPropertyNames();
    console.debug('oldNames: ', oldNames);
    console.debug('newNames: ', newNames);
    const dbIds = [];
    for (const [displayName, dbId] of Object.entries(dbIdMap)) {
        console.debug('-----');
        console.debug('displayName: ', displayName);
        console.debug('dbId: ', dbId);
        if (dbIds.indexOf(dbId) >= 0) {
            console.debug('already converted');
            continue;
        }
        dbIds.push(dbId);
        numDbs++;
        //if (numDbs >= 6) break; // デバッグ
        console.debug('db count: ', numDbs);
        const res = await notion.databases.retrieve({ database_id: dbId });
        //console.debug('res: ', res);
        //console.debug('properties: ', res.properties);
        //console.debug('title: ', res.title);
        // 現在のプロパティ名に旧プロパティ名が含まれているかどうかをチェックする
        const newNamesContained = checkPropertyNamesContained(res.properties, newNames);
        console.debug('newNamesContained: ', newNamesContained);
        if (newNamesContained) {
            console.debug('already converted');
            continue;
        }
        const oldNamesContained = checkPropertyNamesContained(res.properties, oldNames);
        console.debug('oldNamesContained: ', oldNamesContained);
        if (! oldNamesContained) {
            console.error('any old property name is not contained: ', oldNames);
            break;
        }
        // プロパティを変換する
        await notion.databases.update({database_id: dbId, properties: convertProperties});
        const res2 = await notion.databases.retrieve({ database_id: dbId });
        const newNamesContained2 = checkPropertyNamesContained(res2.properties, newNames);
        console.debug('newNamesContained2: ', newNamesContained2);
        //break;
    }
}
main()
