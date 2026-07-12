Page({
  data: {
    messages: [
      {
        id: "welcome",
        role: "assistant",
        content: "你好，我是你的 AI 助手。有什么想聊的吗？",
      },
    ],
    inputValue: "",
    isLoading: false,
    scrollIntoView: "message-welcome",
  },

  onInput(e) {
    this.setData({ inputValue: e.detail.value });
  },

  async sendMessage() {
    const content = this.data.inputValue.trim();
    if (!content || this.data.isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
    };
    const messages = [...this.data.messages, userMessage];
    this.setData({
      messages,
      inputValue: "",
      isLoading: true,
      scrollIntoView: `message-${userMessage.id}`,
    });

    try {
      const response = await wx.cloud.callFunction({
        name: "quickstartFunctions",
        data: {
          type: "chat",
          // 云函数只需要 role 和 content；最多保留最近 12 条，控制上下文长度和费用。
          messages: messages.slice(-12).map(({ role, content: text }) => ({
            role,
            content: text,
          })),
        },
      });
      const answer = response.result && response.result.content;
      if (!answer) throw new Error("模型没有返回有效内容");

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
      };
      this.setData({
        messages: [...messages, assistantMessage],
        scrollIntoView: `message-${assistantMessage.id}`,
      });
    } catch (error) {
      console.error("chat failed", error);
      const detail = error.errMsg || error.message || "请检查云函数和模型配置";
      wx.showToast({ title: detail.slice(0, 30), icon: "none" });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  clearConversation() {
    if (this.data.isLoading) return;
    this.setData({
      messages: [
        {
          id: "welcome",
          role: "assistant",
          content: "已开始新的对话。有什么想聊的吗？",
        },
      ],
      scrollIntoView: "message-welcome",
    });
  },
});
