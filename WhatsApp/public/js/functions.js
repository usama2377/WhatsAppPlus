function formatAMPM(date) {
    var hours = date.getHours()
    var minutes = date.getMinutes()
    var ampm = hours >= 12 ? 'pm' : 'am'
    hours = hours % 12
    hours = hours ? hours : 12 // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes
    var strTime = hours + ':' + minutes + ' ' + ampm
    return strTime
}

function htmlToElement(html, jid, count, date, chatTitle, lastMessage) {
    var template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    firstChild = template.content.firstChild
    contactDiv = $(firstChild).find('.contact')
    fontname = $(firstChild).find('.font-name')
    contactTime = $(firstChild).find('.contact-time')
    fontpreview = $(firstChild).find('.font-preview')
    if (lastMessage) {
        if (jid.includes('@g.us')) {
            if (lastMessage.key.fromMe) {
                fontpreview.text(getMessageText('You: ' + getMessageText(lastMessage)))
            } else {
                if (lastMessage.participant) {
                    lastSender = lastMessage.participant.replace('@s.whatsapp.net', '')

                    fontpreview.text(lastSender + ': ' + getMessageText(lastMessage))
                }
            }
        } else {
            fontpreview.text(getMessageText(lastMessage))
        }
    }

    jid = jid.replace('@g.us', '')
    jid = jid.replace('@s.whatsapp.net', '')

    contactDiv.prop('id', jid)

    if (count > 0 && lastMessage) {
        if (!lastMessage.key.fromMe) {
            contactDiv.addClass('new-message-contact')
            contactTime.append(`<div class="new-message" ><span class="count">
            ${count}</span></div>`)
        }
    }
    contactTime.find('.time').text(date)
    fontname.text(chatTitle)
    return firstChild
}
// function getMessageData(msg){
//     try {
//         messageContent = null
//         messageContent = msg.conversation
//         if (messageContent == undefined) {
//             if (msg.extendedTextMessage != undefined) {
//                 messageContent = msg.extendedTextMessage.text
//             }
//         }
//         if (messageContent == undefined) {
//             messageContent = Object.keys(msg)[0]
//         }
//         return messageText
//     } catch (error) {
//         messageText = 'null'
//         return messageText
//     }
// }
function getMessageText(msg) {
    try {
        if (typeof msg == 'string') {
            return msg
        }
        if (!msg.message) {
            if (msg.messageStubType == 'REVOKE') {
                return '*Deleted Message*'
            } else {
                return msg.messageStubType
            }
        }
        messageText = null
        messageText = msg.message.conversation
        if (messageText == undefined) {
            if (msg.message.extendedTextMessage != undefined) {
                messageText = msg.message.extendedTextMessage.text
            }
        }
        if (messageText == undefined) {
            messageText = Object.keys(msg.message)[0]
        }

        return messageText
    } catch (error) {
        messageText = 'null'
        return messageText
    }
}

function getChatByJid(jid) {
    var result = getReceivedChats().find((obj) => {
        return obj.jid === jid
    })
    return result
}
function getChatName(jid) {
    var result = getReceivedChats().find((obj) => {
        return obj.jid === jid
    })

    if (result != undefined) {
        return result.name || result.notify || result.jid
    }
}

function updateSendersName() {
    $('.sender').each(function (index) {
        if ($(this).text().trim().includes('@')) {
            jid = $(this).text().trim()
            jid = jid.replace('>', '')
            if (getReceivedContacts()[jid]) {
                senderName = getReceivedContacts()[jid].name
                senderNotifyName = getReceivedContacts()[jid].notify
                if (senderName) {
                    $(this).text(senderName)
                } else if (senderNotifyName) {
                    $(this).text(senderNotifyName)
                }
            }
        }
    })

    $('.font-preview').each(function (index) {
        number = $(this).text().trim().split(':')[0]

        if (getReceivedContacts()[number + '@s.whatsapp.net']) {
            senderName = getReceivedContacts()[number + '@s.whatsapp.net'].name
            senderNotifyName = getReceivedContacts()[number + '@s.whatsapp.net'].notify
            if (senderName) {
                $(this).text($(this).text().replace(number, senderName.split(' ')[0]))

                // console.log(senderName.split(" ")[0]);
            } else if (senderNotifyName) {
                $(this).text($(this).text().replace(number, senderNotifyName.split(' ')[0]))
                // console.log(senderNotifyName.split(" ")[0]);
            }
        }
    })
    $('.font-name').each(function (index) {
        if ($(this).text().trim().includes('@')) {
            jid = $(this).text().trim()
            if (getReceivedContacts()[jid]) {
                senderName = getReceivedContacts()[jid].name
                senderNotifyName = getReceivedContacts()[jid].notify
                if (senderName) {
                    $(this).text(senderName)
                } else if (senderNotifyName) {
                    $(this).text(senderNotifyName)
                }
            }
        }
    })
}

function getImageMessage(msg, msgElement) {
    imageHtml = `<img src="" class="imageMsg"/>`
    template = document.createElement('template')
    imageHtml = imageHtml.trim() // Never return a text node of whitespace as the result
    template.innerHTML = imageHtml
    imageElement = template.content.firstChild

    $(msgElement).find('.content').text('')
    $(msgElement).find('.content').append(imageElement)

    imageSrc = 'Media/' + msg.key.remoteJid.split('@')[0] + '_' + msg.messageTimestamp + '.jpeg'
    $(msgElement).find('.imageMsg').attr('src', imageSrc)
    return msgElement
}

function getAudioMessage(msg, msgElement) {
    audioHtml = `<audio controls>
        <source src type="audio/ogg" class="oggSrc">
        <source src type="audio/mpeg" class="mpegSrc">
      Your browser does not support the audio element.
      </audio>`
    template = document.createElement('template')
    audioHtml = audioHtml.trim() // Never return a text node of whitespace as the result
    template.innerHTML = audioHtml
    audioElement = template.content.firstChild

    $(msgElement).find('.content').text('')
    $(msgElement).find('.content').append(audioElement)
    console.log(msg.key.remoteJid.split('@')[0])
    oggSrc = 'Media/' + msg.key.remoteJid.split('@')[0] + '_' + msg.messageTimestamp + '.ogg'
    mpegSrc = 'Media/' + msg.key.remoteJid.split('@')[0] + '_' + msg.messageTimestamp + '.mpeg'
    $(msgElement).find('.oggSrc').attr('src', oggSrc)
    $(msgElement).find('.mpegSrc').attr('src', mpegSrc)
    return msgElement
}

function getNotifician(m) {
    html = `<div class="notify"></div>`
    var template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    firstChild = template.content.firstChild
    notification = m.messageStubType
    dateTime = getDateTime(m.messageTimestamp)
    if (m.key.remoteJid.includes('-')) {
        if (m.messageStubParameters) {
            sender = m.messageStubParameters.toString()
        } else {
            sender = m.key.participant
        }
    } else {
        sender = m.key.remoteJid
    }
    $(firstChild).text(sender + ' -- ' + notification + ' -- ' + dateTime)
    return firstChild
}
function createMessageElement(msg, isCategory) {
    fromMe = msg.key.fromMe ? 'my-mouth' : 'your-mouth'

    html = `<div class="chat-bubble" id=${msg.key.remoteJid}>
<span class="msg-id">${msg.key.id}</span>
        <div class="${fromMe}"></div>    
    <div class="content">${getMessageText(msg)} </div>
    <div class="time">${getDateTime(msg.messageTimestamp)}</div>
    </div>`
    var template = document.createElement('template')
    html = html.trim() // Never return a text node of whitespace as the result
    template.innerHTML = html
    firstChild = template.content.firstChild

    msg.key.fromMe ? $(firstChild).addClass('me') : $(firstChild).addClass('you')

    if (isCategory && !msg.key.fromMe) {
        $(firstChild).prepend(`<h6 class="groupTitle">
            ${getReceivedChats().find((x) => x.jid === msg.key.remoteJid).name}</h6>`)

        if (fromMe == 'your-mouth') {
            $(firstChild).find('.groupTitle').after(`<div><i class="sender">${msg.key.participant}></i>`)
        }
    } else if (msg.key.remoteJid.includes('-') && !msg.key.fromMe) {
        $(firstChild).prepend(`<h6 class="sender">
            ${msg.key.participant}</h6>`)
    }

    return firstChild
}

function prependChatBoxMessages(messages, isCategory, cursor) {
    if ($('.cursor').length == 0) {
        $('.chat').empty()
        $('.chat-head').append(`<span class="cursor" id=${cursor.fromMe}>${cursor.id}</span>`)
    } else {
        $('.cursor').text(cursor.id)
        $('.cursor').prop('id', cursor.fromMe)
    }

    for (var i = messages.length - 1; i >= 0; i--) {
        if (!messages[i].message) {
            if (messages[i].messageStubType == 'REVOKE') {
                $('.chat').prepend(createMessageElement(messages[i], isCategory))
            } else {
                $('.chat').prepend(getNotifician(messages[i]))
            }
        } else {
            msgType = Object.keys(messages[i].message)[0]
            if (msgType == 'imageMessage') {
                messagElement = createMessageElement(messages[i], isCategory)
                $('.chat').prepend(getImageMessage(messages[i], messagElement))
            } else if (msgType == 'audioMessage') {
                messagElement = createMessageElement(messages[i], isCategory)
                $('.chat').prepend(getAudioMessage(messages[i], messagElement))
            } else {
                $('.chat').prepend(createMessageElement(messages[i], isCategory))
            }
        }
    }
    updateSendersName()
}
function appendchatBoxMessage(m, remoteJid, isCategory) {
    let activeID = $('.active-contact').prop('id')

    if (remoteJid == activeID) {
        console.log('same window')
        if (!m.message) {
            if (m.messageStubType == 'REVOKE') {
                $('.chat').append(createMessageElement(m, isCategory))
            } else {
                $('.chat').append(getNotifician(m))
            }
        } else {
            msgType = Object.keys(m.message)[0]
            if (msgType == 'imageMessage') {
                messagElement = createMessageElement(m, isCategory)
                $('.chat').append(getImageMessage(m, messagElement))
            } else if (msgType == 'audioMessage') {
                messagElement = createMessageElement(m, isCategory)
                $('.chat').append(getAudioMessage(m, messagElement))
            } else {
                $('.chat').append(createMessageElement(m, isCategory))
            }
        }
        items = document.querySelectorAll('.chat-bubble')
        last = items[items.length - 1]
        last.scrollIntoView()
        $('body, html').css('scrollTop', $('.chat-bubble').last().offset().top)

        // $("body, html").animate(
        //   { scrollTop: $(".chat-bubble").last().offset().top },
        //   10
        // );
    }
    updateSendersName()
}

function playSound(url = 'sounds/message.ogg') {
    const audio = new Audio(url)
    audio.play()
}

function getDateTime(timestamp) {
    dateTime = new Date(timestamp * 1000)

    if (new Date().setHours(0, 0, 0, 0) !== new Date(timestamp * 1000).setHours(0, 0, 0, 0)) {
        return dateTime.toLocaleString().split(',')[0]
    } else {
        return formatAMPM(dateTime)
    }
}

function showMessages(messages, isCategory) {
    for (m of messages) {
        if (!m.message) {
            if (m.messageStubType == 'REVOKE') {
                $('.chat').append(createMessageElement(m, isCategory))
            } else {
                $('.chat').append(getNotifician(m))
            }
        } else {
            msgType = Object.keys(m.message)[0]
            if (msgType == 'imageMessage') {
                messagElement = createMessageElement(m, isCategory)
                $('.chat').append(getImageMessage(m, messagElement))
            } else if (msgType == 'audioMessage') {
                messagElement = createMessageElement(m, isCategory)
                $('.chat').append(getAudioMessage(m, messagElement))
            } else {
                $('.chat').append(createMessageElement(m, isCategory))
            }
        }
    }
}

function sendMessage(file, text, msgType) {
    if (getCategories().indexOf($('.active-contact').prop('id')) != -1) {
        if ($('.active-message').length == 0) {
            alert('Please select conversation..')
            return
        } else {
            remoteJid = $('.active-message').prop('id')
        }
    } else {
        remoteJid = getCompleteJid($('.active-contact').prop('id'))
    }
    if (file) {
        // let ext = file.name.split(".").pop();
        if (msgType == 'RecordedAudioMessage' || msgType == 'AudioMessage') {
            ext = '.mpeg'
        } else if (msgType == 'ImageMessage') {
            ext = '.jpeg'
        }

        file = renameFile(file, remoteJid + ext)
    }

    var data = new FormData()
    data.append('remoteJid', remoteJid)
    data.append('file', file)
    data.append('text', text)
    data.append('msgType', msgType)

    if ($('.loader').length == 0) {
        $('.chat').append(`<div class="loader"></div>`)
        items = document.querySelectorAll('.loader')
        last = items[items.length - 1]
        last.scrollIntoView()
        $('body, html').css('scrollTop', $('.loader').last().offset().top)
    }
    $.ajax({
        url: 'http://localhost:8000/fileUpload',
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        method: 'POST',
        type: 'POST', // For jQuery < 1.9
        success: function (data) {
            console.log(data)
            $('.loader').remove()
        },
    })

    $('#deletebtn').remove()
    $('.input-message').val('')
    $('.input-message').prop('disabled', false)

    return false
}

function renameFile(originalFile, newName) {
    return new File([originalFile], newName, {
        type: originalFile.type,
        lastModified: originalFile.lastModified,
    })
}
function prepareMsg() {
    if ($('.input-message').val() == '') {
        alert('Cannot send empty Message!')
        return
    }
    msgType = ''
    let file = $('#imgupload').prop('files')[0]
    if (file == undefined && blob == undefined) {
        msgType = 'TextMessage'
        text = $('.input-message').val()

        sendMessage(null, text, msgType)
    } else if (blob != undefined) {
        msgType = 'RecordedAudioMessage'
        audio = new File([blob], 'oldname.mpeg')
        sendMessage(audio, null, msgType)
        blob = null
        audio = null
    }
    if (file != undefined) {
        $('#imgupload').val('')
        ext = file.name.split('.')
        ext = ext[ext.length - 1]

        if (file.type.match('image.*')) {
            msgType = 'ImageMessage'
        } else if (file.type.match('video.*')) {
            msgType = 'VideoMessage'
        } else if (file.type.match('audio.*')) {
            msgType = 'AudioMessage'
        } else if (file.type.match('application.*')) {
            msgType = 'DocumentMessage'
        }

        sendMessage(file, null, msgType)
    }

    return false
}
function addCategoriesChatBox(categories) {
    for (category of categories) {
        $('.contact-list').append(
            htmlToElement(
                chatElement,
                category,
                0,
                formatAMPM(new Date()),
                category.toUpperCase() + ' Chats',
                'No new Message',
            ),
        )
    }
    let activateContactId = $('.chat-head').attr('id')
    if (activateContactId) {
        $('.contact' + '#' + activateContactId).addClass('active-contact')
    }
}

function getCompleteJid(jid) {
    if (jid.includes('@')) {
        return jid
    }
    if (jid.includes('-')) {
        return (jid += '@g.us')
    }
    return (jid += '@s.whatsapp.net')
}

function getHalfJid(jid) {
    jid = jid.replace('@g.us', '')
    jid = jid.replace('@s.whatsapp.net', '')
    return jid
}
function appendCategoryMessages(msg, remoteJid) {
    if (newMessages[remoteJid]) {
        newMessages[remoteJid].push(msg.data)
    } else {
        newMessages[remoteJid] = []
        newMessages[remoteJid].push(msg.data)
    }
}
function prependArry(value, array) {
    var newArray = array.slice()
    newArray.unshift(value)
    return newArray
}
function populateContactList(contactList) {
    ignoreChats = []
    for (chat of contactList) {
        if (isIgnoreChat(chat.name || chat.jid)) {
            ignoreChats.push(chat)
            console.log('Ignoring chat- ', chat.name || chat.jid.split('@')[0])
            continue
        }
        date = getDateTime(chat.t)

        lastMessage = null

        if (chat.messages[chat.messages.length - 1] != null) {
            lastMessage = chat.messages[chat.messages.length - 1]
        }

        chatTitle = chat.name || chat.notify || chat.jid

        element = htmlToElement(chatElement, chat.jid, chat.count, date, chatTitle, lastMessage)
        $('.contact-list').append(element)
    }
    for (chat of ignoreChats) {
        console.log(chat)
        date = getDateTime(chat.t)

        lastMessage = null

        if (chat.messages[chat.messages.length - 1] != null) {
            lastMessage = chat.messages[chat.messages.length - 1]
        }

        chatTitle = chat.name || chat.notify || chat.jid

        element = htmlToElement(chatElement, chat.jid, chat.count, date, chatTitle, lastMessage)
        $('.contact-list').append(element)
    }
    let activateContactId = $('.chat-head').attr('id')
    if (activateContactId) {
        $('.contact' + '#' + activateContactId).addClass('active-contact')
    }
}
function getReceivedChats() {
    return receivedChats
}
function getIgnoreList() {
    return ignoreList
}
function getReceivedContacts() {
    return receivedContacts
}
function getCategories() {
    return categories
}

function notStatusChat(chat) {
    try {
        if (chat.jid !== 'status@broadcast') {
            return true
        }
        console.log('status@broadcast chat found')
        console.log(chat)
        return false
    } catch (error) {
        console.log(error)
    }
}
function isIgnoreChat(name) {
    try {
        for (ignoreChat of getIgnoreList()) {
            if (name.toLowerCase() === ignoreChat) {
                return true
            }
        }
        return false
    } catch {
        return false
    }
}
// function getChats(keyword) {
//   matchedChats = [];

//   for (chat of receivedChats) {
//     try {
//       if (chat.name.toLowerCase().includes(keyword)) {
//         matchedChats.push(chat);
//       }
//     } catch (error) {
//       console.log(error, chat);
//       continue;
//     }
//   }
//   return matchedChats;
// }
function appendMessages(msg, remoteJid) {
    messages = getReceivedChats()
        .find((x) => x.jid === remoteJid)
        .messages.push(msg.data)
    // if (newMessages[remoteJid]) {
    //   newMessages[remoteJid].push(msg.data);
    // } else {
    //   newMessages[remoteJid] = [];
    //   newMessages[remoteJid].push(msg.data);
    // }
}

function getChats(keyword) {
    return receivedChats.filter((chat) => {
        if (chat.name) {
            return chat.name.toLowerCase().includes(keyword)
        }
    })
}
