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
 * 現在の日本時間を ISO 8601 形式の文字列で取得する。
 * @returns {string} 現在の日本時間を ISO 8601 形式にフォーマットした文字列
 */
const getJapanTime = () => {
  const now = new Date();
  const jstOffset = 9 * 60 * 60 * 1000; // 日本時間のオフセット（9時間）をミリ秒単位で計算
  const jstDate = new Date(now.getTime() + jstOffset); // 現在時刻にオフセットを加算して、日本時間に変換
  const isoString = jstDate.toISOString(); // ISO 8601形式にフォーマット
  // console.log(isoString); // 例: 2023-05-06T14:30:00.000Z
  return isoString
}

/**
 * レコードを更新する
 * @param {Object} page - 更新するレコードオブジェクト
 * @return {Promise} レコード更新のPromise
 */
const updateDatabaseRecord = async (page, isoString) => {
  if (!page.id) return;

  const pageId = page.id;
  const dateObject = { "date": { "start": isoString } };
  const response = await notion.pages.update({
    page_id: pageId,
    properties: {
      'データ移動': dateObject,
    },
  });
  // console.log(response);
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
 * データベースの検索クエリに使用するソートオブジェクトの配列
 * @type {Array}
 * @property {Object} property - ソートするプロパティ名
 * @property {string} direction - ソート方向（"ascending"または"descending"）
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
    const dateIsoString = getJapanTime(); // 処理日時を取得
    console.log(dateIsoString);
    // データベースを検索するクエリを実行する
    const response = await notion.databases.query({
      database_id: masters['本番用'],
      filter: queryFilter,
      sorts: querySorts,
      page_size: 100,
    });
    const databaseResults = response.results; // 検索結果の取得
    databaseResults.forEach(record => {
      if (!record.properties.幕屋タグ.select || !record.properties.幕屋タグ.select.name)
        return; // 幕屋タグが無ければスキップ
      if (!record.properties.受付番号.number)
        return; // 受付け番号が無ければスキップ

      console.log(`${record.properties.氏名.formula.string}: ${record.properties.幕屋タグ.select.name}`);
      const makuyaId = masters[record.properties.幕屋タグ.select.name]; // dbIdを取得

      if (!makuyaId)
      {
        console.log(`no master: ${record.properties.幕屋タグ.select.name}`);
        return;
      }

      // コピーフラグを更新
      updateDatabaseRecord(record, dateIsoString);
      record.properties.データ移動.date = { "start": dateIsoString };
      // console.log(record);
      
      // バックアップ
      copyNotionPage(record, masters['バックアップ']);

      // 各幕屋に展開
      copyNotionPage(record, makuyaId);
    });

  } catch (error) {
    console.error(error);
  }
}

// 各地にデータを分配する。
distributePages();
