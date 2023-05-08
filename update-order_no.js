const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = './secret/.env';
const INS_FILE = './secret/masters.json'

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
 * @param {Object} page - 更新するレコードオブジェクト
 * @return {Promise} レコード更新のPromise
 */
const updateDatabaseRecord = async (page, new_number) => {
  if (!page.id) return;

  console.log(`id: ${page.id}; order: ${new_number}`);
  const pageId = page.id;
  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      '受付番号': { number: new_number },
    },
  });
  // console.log(response);
}

/**
 * データベースの検索クエリに使用するフィルターオブジェクト
 * @type {Object}
 * @property {Array} and - 各条件のAND条件での結合を表す配列
 * @property {Object} and[n].property - プロパティ名
 * @property {Object} and[n].select - プロパティ値がSelect型の場合の検索条件
 * @property {Object} and[n].select.is_not_empty - Select型プロパティが空でない場合の検索条件
 * @property {Object} and[n].number - プロパティ値がNumber型の場合の検索条件
 * @property {Object} and[n].number.is_not_empty - Number型プロパティが空でない場合の検索条件
 * @property {Object} and[n].date - プロパティ値がDate型の場合の検索条件
 * @property {Object} and[n].date.is_empty - Date型プロパティが空の場合の検索条件
 */
const queryFilter = {
  "and": [
    {
      "property": "受付番号",
      "number": {
        "is_empty": true
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

const queryMaxFilter = {
  "and": [
    {
      "property": "受付番号",
      "number": {
        "is_not_empty": true
      }
    }
  ]
};

/**
 * データベースの検索クエリに使用するソートオブジェクトの配列
 * @type {Array}
 * @property {Object} property - ソートするプロパティ名
 * @property {string} direction - ソート方向（"ascending"または"descending"）
 */
const queryAscSorts = [
  {
    property: '作成日時',
    direction: 'ascending',
  },
];

const queryDscSorts = [
  {
    property: '受付番号',
    direction: 'descending',
  }
];

/**
 * Notionデータベースの内容を取得する
 * @return {Promise} 取得結果のPromise
 */
const updateOrders = async () => {
  try {
    // データベースを検索するクエリを実行する
    const responseMax = await notion.databases.query({
      database_id: masters['本番用'],
      filter: queryMaxFilter,
      sorts: queryDscSorts,
      page_size: 1,
    });

    // 現在の受付番号の最大値を取得
    const databaseResults = responseMax.results; // 検索結果の取得
    const maxNumber = databaseResults[0].properties.受付番号.number;
    console.log(`max order number: ${maxNumber}`);

    // 更新対象レコードを取得
    const updateTargets = await notion.databases.query({
      database_id: masters['本番用'],
      filter: queryFilter,
      sorts: queryAscSorts,
      page_size: 100,
    });

    let new_order = maxNumber + 1;
    updateTargets.results.forEach(record => {
      // console.error(record);
      updateDatabaseRecord(record, new_order);
      new_order = new_order + 1;
    });

  } catch (error) {
    console.error(error);
  }
}

// 各地にデータを分配する。
updateOrders();
