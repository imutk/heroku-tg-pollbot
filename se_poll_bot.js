const TeleBot = require('telebot');
const bot = new TeleBot('682072187:AAGIxsvPJWCmbKL3ewjrLv0YFF1sCmKR95g');
let poll_message;
let poll_active = false;
let poll_name;
let creator_id;
let options = [];
let users_voted = {};
// bot.on(['/start', '/back'], msg => {

//     let replyMarkup = bot.inlineKeyboard([
//         [
//             bot.inlineButton('callback', {callback: 'this_is_data'})
//         ]
//     ]);

//     return bot.sendMessage(msg.from.id, 'Inline keyboard example.', {replyMarkup}).then(re => {
//         lastMessage = [msg.from.id, re.message_id];
//     });

// });
bot.on('/start', msg => {
    return bot.sendMessage(msg.chat.id, 'Чтобы создать голосование напишите:\n/new <название голосования>');
});

bot.on(/^\/new (.+)$/, (msg, props) => {
    if(poll_active) {
        return bot.sendMessage(msg.chat.id, 'Сначала завершите предыдущее голосование!');
    }
    poll_name = props.match[1];
    poll_active = true;
    creator_id = msg.from.id;
    return bot.sendMessage(msg.chat.id, `Голосование \"${poll_name}\" создано.\nЧтобы добавить вариант напишите: /add <вариант>\nНачать голосование: /begin`);
});

bot.on(/^\/add (.+)$/, (msg, props) => {
    if(msg.from.id == creator_id) {
        if(!poll_active) {
            return bot.sendMessage(msg.chat.id, 'Сначала создайте голосование!');
        }
        let opt = props.match[1];
        options.push([opt, 0]);
        return bot.sendMessage(msg.chat.id, `Вариант \"${opt}\" добавлен. Чтобы увидеть список: /list`);
    }
    else {
        return true;
    }
});

bot.on('/list', msg => {
    if(!poll_active) {
        return bot.sendMessage(msg.chat.id, 'Сначала создайте голосование!');
    }
    let text = 'Варианты:';
    for(let i = 0; i < options.length; i++){
        text += `\n${i+1}. ` + options[i][0];
    }
    return bot.sendMessage(msg.chat.id, text);
});

bot.on('/begin', msg => {
    if(msg.from.id == creator_id) {
        let bttns = [];
        for(let i = 0; i < options.length; i++) {
            bttns.push([bot.inlineButton(options[i][0] + ' - ' + options[i][1], {callback: i.toString()})])
        }
        let replyMarkup = bot.inlineKeyboard(bttns);
        return bot.sendMessage(msg.chat.id, `Голосование \"${poll_name}\". Чтобы закончить голосование напиши: /end`, {replyMarkup}).then(re => {
            poll_message = [msg.chat.id, re.message_id];
        });
    }
    else {
        return true;
    }
});

bot.on('callbackQuery', msg => {
    bot.answerCallbackQuery(msg.id);
    let [chatId, messageId] = poll_message;
    let data = msg.data;
    if(msg.from.id in users_voted) {
        if(users_voted[`${msg.from.id}`] == data) {
            options[data][1] -= 1;
            delete users_voted[`${msg.from.id}`];
        }
        else {
            return true;
        } 
    } else {
        users_voted[`${msg.from.id}`] = data;
        options[data][1] += 1;
    }
    let bttns = [];
    for(let i = 0; i < options.length; i++) {
        bttns.push([bot.inlineButton(options[i][0] + ' - ' + options[i][1], {callback: i.toString()})])
    }
    let replyMarkup = bot.inlineKeyboard(bttns);
    return bot.editMessageReplyMarkup({chatId, messageId}, {replyMarkup});
});

bot.on('/end', msg => {
    if(msg.from.id == creator_id) {
        if(poll_message) {
            let [chatId, messageId] = poll_message;
            poll_active = false;
            bot.deleteMessage(chatId, messageId);
            let text = 'Результаты:';
            for(let i = 0; i < options.length; i++){
                text += '\n' + options[i][0] + ' - ' + options[i][1];
            }
            options = [];
            users_voted = {};
            poll_message = undefined;
            return bot.sendMessage(msg.chat.id, text);
        }
        else {
            return bot.sendMessage(msg.chat.id, 'Сначала начните голосование!');
        }
    }
    else {
        return true;
    }
});

// bot.on('callbackQuery', msg => {
//     // User message alert
//     bot.answerCallbackQuery(msg.id);
//     let [chatId, messageId] = lastMessage;
//     let replyMarkup = bot.inlineKeyboard([
//         [
//             bot.inlineButton('ok', {callback: 'this_is_data'})
//         ]
//     ]);
//     bot.sendMessage(msg.from.id, `Inline button callback: ${ msg.data }`);
//     return bot.editMessageReplyMarkup({chatId, messageId}, {replyMarkup})
// });


bot.start();