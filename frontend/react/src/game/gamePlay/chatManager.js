const messageHistoryLimit = 100;

class ChatManager {
  constructor() {
    this.messages = [];
  }
  addNewMessages(newChatMessages) {
    // TODO: Enforce order
    if (newChatMessages == undefined) return;
    for (let message of newChatMessages) {
      if (
        message != undefined &&
        message.text != undefined &&
        message.text != ""
      )
        this.messages.push(message);
    }

    if (this.messages.length > messageHistoryLimit)
      this.messages.splice(0, this.messages.length - messageHistoryLimit);
  }
}

export default ChatManager;
export { messageHistoryLimit };
