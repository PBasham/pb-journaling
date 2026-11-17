// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_item_locks.sql';
import m0002 from './0002_pins_and_trash.sql';
import m0003 from './0003_tags_templates_photos.sql';
import m0004 from './0004_book_collection_tags.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004
    }
  }
  