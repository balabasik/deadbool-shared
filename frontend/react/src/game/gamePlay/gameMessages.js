import { GetTime, RandomString } from "./utils";

class GameMessage {
  constructor(id, text, creationTime, duration, priority) {
    this.id = id;
    this.text = text;
    this.creationTime = creationTime;
    this.duration = duration;
    this.priority = priority;
  }
}

// NOTE: On client all the messages are queued from the server.
// NOTE: On server we create message ids, duration, etc.s

class MessageManager {
  constructor() {
    this.messages = {};
  }

  // NOTE: If we only use this API to create messages, then at every point of time
  // messages are sorted by creation time in the dictionary
  // TODO: Create a proper queue
  createMessage(text, duration, priority) {
    // NOTE: To avoid the message stack blow up, we only allow up to 10 messages to be stored simultaniously
    if (Object.keys(this.messages).length >= 10) {
      let result = this.removeOldestMessage(priority);
      if (result == 0) return; // all the messages have higher priority so we didn't remove anything, and we can't add the new one
    }
    let id = RandomString();
    let time = GetTime();
    this.messages[id] = new GameMessage(id, text, time, duration, priority);
    setTimeout(this.deleteMessage.bind(this, id), duration); // what happens if class gets destructed??
  }

  removeOldestMessage(priority) {
    // Priority decides if the old/unexpired message should be switched to the new one
    // NOTE: Priority 0 indicates that message is so important that no matter what it has to be shown to user
    // NOTE: Priority 1 indicates that message is important, but we cannot hold it for too long
    // NOTE: Priority 2: anything else

    // UPDATE: If priority is 0, we remove all non-zeros in the current queue.
    // Else we queue it behind.
    if (Object.keys(this.messages).length == 0) return 0; // nothing to delete
    if (priority == 0) {
      let toDelete = [];
      for (let i = 0; i < Object.keys(this.messages).length; i++) {
        if (this.messages[Object.keys(this.messages)[i]].priority == 0)
          continue;
        toDelete.push(Object.keys(this.messages)[i]);
      }
      if (toDelete.length == 0)
        // All the messages were 0, so jsut delete one the oldest one.
        this.deleteMessage(Object.keys(this.messages)[0]);
      else for (let d of toDelete) this.deleteMessage(d);
      return 1;
    }

    // By this point priority>0

    let candidate = -1;
    for (let i = 0; i < Object.keys(this.messages).length; i++) {
      if (this.messages[Object.keys(this.messages)[i]].priority == 0) continue;
      else if (this.messages[Object.keys(this.messages)[i]].priority == 1) {
        this.messages[Object.keys(this.messages)[i]].priority = 2;
        if (candidate == -1) {
          candidate = i;
        }
        continue;
      }
      this.deleteMessage(Object.keys(this.messages)[i]);
      return 1; // removed message
    }

    if (priority > 1) return 0; // message is 2 while all the queud are higher;

    // All the messages were 0 and 1s, remove 1, or the latest 0.
    if (candidate == -1) return 0; // all the messages are 0, but new one is not so urgent
    this.deleteMessage(Object.keys(this.messages)[candidate]);
    return 1;
  }

  getTheOldestMessage() {
    if (Object.keys(this.messages).length == 0) return "";
    return this.messages[Object.keys(this.messages)[0]].text;
  }

  deleteMessage(id) {
    if (this.messages[id] == undefined) return; // message was already deleted.
    delete this.messages[id];
  }
}

export default MessageManager;
export { GameMessage };
