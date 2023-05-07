const { Client } = require('@notionhq/client');
const dotenv = require('dotenv');

const ENV_FILE = './secret/.env';

dotenv.config({path: ENV_FILE});

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const getBlocks = async () => {
    const blockId = process.env.PAGE_ID;
    const response = await notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
    });
    console.log(response);
    return response;
};

const getBlock = async () => {
    const blockId = process.env.BLOCK_ID;
    const response = await notion.blocks.retrieve({
      block_id: blockId,
    });
    console.log(response);
    return response;
};

const appendBlockChildren = async (object) => {
    const blockId = process.env.PAGE_ID;
    const response = await notion.blocks.children.append({
      block_id: blockId,
      children: [object],
    });
    console.log(response);
  };

const obj = getBlock();
// getBlocks();
appendBlockChildren(obj);