const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = '../secret/.env';
const INS_FILE = '../secret/masters.json'

// 設定ファイルを読み込む
dotenv.config({path: ENV_FILE});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

/**
 * 表示名 -> DB ID のマップオブジェクト
 * @type {{[key: string]: string}}
 */
const masters = (() => {
  const fs = require('fs');
  const jsonData = fs.readFileSync(INS_FILE);
  const jsonObj = JSON.parse(jsonData);
  return jsonObj;
})();

/**
 * レコードを更新する
 * @param {Object} record - 更新するレコードオブジェクト
 * @return {Promise} レコード更新のPromise
 */
const updateDatabaseRecord = async (record) => {
  if (record.properties['データ移動']) {
    record.properties['データ移動'].date.start = Date.now();
  }
  const response = await notion.pages.update(record);
  console.log(response);
}

/**
 * 新しいレコードを作成する
 * @param {Object} postObject - 作成するレコードオブジェクト
 * @param {string} dbId - 追加するデータベースのID
 * @return {Promise} レコード作成のPromise
 */
const copyNotionPage = async (postObject, dbId) => {
  const clone = JSON.parse(JSON.stringify(postObject));
  removeFormulaProperties(clone);
  clone.parent.database_id = dbId;
  const response = await notion.pages.create(clone);
  // console.log(response);
}

/**
 * レコードから計算フィールドを削除する
 * @param {Object} obj - フィールドを削除するレコードオブジェクト
 * @return {void}
 */
const removeFormulaProperties = (obj) => {
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      removeFormulaProperties(obj[key]);
    }
    if (obj[key] && obj[key].type === 'formula') {
      delete obj[key];
    }
    if (obj[key] && (key === '作成日時' || key === '最終更新日時')) {
      delete obj[key];
    }
  }
}

/**
 * 
 */
const queryFilter = {
  "and": [
    {
      "property": "幕屋タグ",
      "select": {
        "is_not_empty": true
      }
    },
    {
      "property": "受付番号",
      "number": {
        "is_not_empty": true
      }
    }, 
    {
      "property": "データ移動",
      "date": {
        "is_empty": true
      }
    }
  ]
};

/**
 * 
 */
const querySorts = [
  {
    property: '作成日時',
    direction: 'ascending',
  },
];

/**
 * Notionデータベースの内容を取得する
 * @return {Promise} 取得結果のPromise
 */
const distributePages = async () => {
  try {
    // データベースを検索するクエリを実行する
    const response = await notion.databases.query({
      database_id: masters['本番用'],
      filter: queryFilter,
      sorts: querySorts,
    });

    // 検索結果の配列を取得する
    const databaseResults = response.results;
    databaseResults.forEach(record => {
      if (!record.properties.幕屋タグ.select || !record.properties.幕屋タグ.select.name)
        return; // 幕屋タグが無ければスキップ
      if (!record.properties.受付番号.number)
        return; // 受付け番号が無ければスキップ

      console.log(`${record.properties.氏名.formula.string}: ${record.properties.幕屋タグ.select.name}`);

      // dbIdを取得
      const makuyaId = masters[record.properties.幕屋タグ.select.name];

      // 更新
      // updateDatabaseRecord(record);
      
      // バックアップ
      copyNotionPage(record, masters['バックアップ']);

      // 各幕屋に展開
      // copyNotionPage(record, makuyaId);
    });

  } catch (error) {
    console.error(error);
  }
}

// データベースの内容を取得する関数を呼び出す
distributePages();
