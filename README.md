UI:

Tubalo
	App
	Plugin
	Controls
		Chat
			ChatControl
		Sidebar
			SidebarControl
			SidebarPanelControl
		Input
			ChatInputControl
			AutoCompleteControl
		Message
			BaseMessage
			SystemMessage
			UserMessage
		Tabs
			TabsetControl
			TabControl


Tubalo.App
	getTabset(): Tubalo.Controls.Tabs.TabsetControl
	getSidebar(): Tubalo.Controls.Sidebar.SidebarControl

Tubalo.Plugin
	initialize( app: Tubalo.App ): void

