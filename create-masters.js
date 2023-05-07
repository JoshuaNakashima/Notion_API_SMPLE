// Notion APIクライアントを初期化する
const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = './secret/.env';
const OUT_FILE = './secret/masters.json'

// 設定ファイルを読み込む
dotenv.config({path: ENV_FILE});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const fs = require('fs');

// JSONに変換するオブジェクト
const masters = {};

const getNameIdElement = (names, id) => {
  names.split(',').forEach(key => {
    masters[key] = id;
  });
}

// 全てのDBを取得する。
(async () => {

  const blockId = process.env.NOTION_MASTER_BLOCK_ID;
  const response = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 150,
  });
  const blocks = response.results;

  blocks.forEach(block => {

    if (block.type === 'child_database')
    {
      console.log(block);

      const matches = block.child_database.title.match(/（(.+)）/); // カッコに囲まれた部分のみ取得
      getNameIdElement(matches[1], block.id);
    }

    if (block.type === 'paragraph')
    {
      // console.log(block);
      block.paragraph.rich_text.forEach(element => {
        if (element.href === null) return;
        
        console.log(`plain_text: ${element.plain_text}`);
        
        console.log(`href: ${element.href}`);
        const href_elms = element.href.split('/');
        const id = href_elms[href_elms.length - 1];
        console.log(`id: ${id}`);

        const matches = element.plain_text.match(/（(.+)）/);
        getNameIdElement(matches[1], id);
      });
    }
  });

  // JSONに変換してファイルに書き出し
  fs.writeFileSync(OUT_FILE, JSON.stringify(masters));

})();
