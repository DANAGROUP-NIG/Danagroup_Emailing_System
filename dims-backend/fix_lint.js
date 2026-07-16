const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/jobs/mail-delivery.processor.ts',
    replace: [ { search: /,\s*Attachment/g, replace: '' }, { search: /Attachment,\s*/g, replace: '' } ]
  },
  {
    file: 'src/modules/channels/channels.controller.ts',
    replace: [ { search: /import \{ SendChannelMessageDto \} from "\.\/dto\/send-channel-message\.dto";\n/, replace: '' } ]
  },
  {
    file: 'src/modules/channels/channels.service.ts',
    replace: [ { search: /,\s*In/g, replace: '' }, { search: /In,\s*/g, replace: '' } ]
  },
  {
    file: 'src/modules/contacts/contacts.service.ts',
    replace: [ { search: /const csvParser = require\("csv-parser"\);/, replace: 'import * as csvParser from "csv-parser";' } ]
  },
  {
    file: 'src/modules/mail/mail-action.service.ts',
    replace: [ 
      { search: /Message,\s*/g, replace: '' },
      { search: /,\s*Message/g, replace: '' },
      { search: /MessageRecipient,\s*/g, replace: '' },
      { search: /,\s*MessageRecipient/g, replace: '' },
      { search: /import \{ MailQueryDto \} from "\.\/dto\/mail-query\.dto";\n/, replace: '' }
    ]
  },
  {
    file: 'src/modules/mail/mail-core.service.ts',
    replace: [ { search: /,\s*In/g, replace: '' }, { search: /In,\s*/g, replace: '' } ]
  },
  {
    file: 'src/modules/storage/storage.service.ts',
    replace: [ 
      { search: /,\s*ForbiddenException/g, replace: '' }, 
      { search: /ForbiddenException,\s*/g, replace: '' },
      { search: /,\s*NotFoundException/g, replace: '' },
      { search: /NotFoundException,\s*/g, replace: '' }
    ]
  }
];

fixes.forEach(fix => {
  const filepath = path.join(__dirname, fix.file);
  if (fs.existsSync(filepath)) {
    let content = fs.readFileSync(filepath, 'utf8');
    fix.replace.forEach(r => {
      content = content.replace(r.search, r.replace);
    });
    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Fixed ${fix.file}`);
  } else {
    console.log(`File not found: ${fix.file}`);
  }
});
