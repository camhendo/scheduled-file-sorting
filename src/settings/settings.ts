import FileSorterPlugin from '../main';
import { FileSorterError } from '../utils/error';
import { FileSuggest, FileSuggestMode } from './fileSuggester';
import { FolderSuggest } from './folderSuggest';
import { log_error } from '../utils/log';
import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
// Remember to rename these classes and interfaces!
interface HistorySettings {
	historySectionTemplate: string;
}

export interface FileSorterSettings {
	searchFolders: Array<string>;
	createDailyNote: boolean;
	createNestedDailyFolders: boolean;
	addNoteLinks: boolean;
	addFilesRegex: RegExp|null;
	addFilesRegexVal: string|null;
	ignoreFiles: Array<string>;
	runFrequency: string;
	createHistoryNotes: boolean;
	history_notes: HistorySettings;
}

export const DEFAULT_SETTINGS: FileSorterSettings = {
	searchFolders: [""],
	createDailyNote: true,
	createNestedDailyFolders: true,
	addNoteLinks: true,
	createHistoryNotes: true,
	history_notes : {
		historySectionTemplate: "### Modified Notes",
	},
	addFilesRegex: null,
	addFilesRegexVal: null,
	ignoreFiles: [""],
	runFrequency: "daily",
}

export class FileSorterSettingsTab extends PluginSettingTab {
	plugin: FileSorterPlugin;

	constructor(app: App, plugin: FileSorterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();
		
		this.create_general_settings();
		if (this.plugin.settings.createHistoryNotes) {
			this.create_history_last_modified_template();
		}

	}

	create_general_settings(): void {
		new Setting(this.containerEl).setName("File Sorter Settings").setHeading();

		const descHeading = document.createDocumentFragment();
        descHeading.append(
			"Organize your notes based on create-date and link to daily notes based on modified/create date.",
			" This is useful for those that don't want to manually move files and need the ability for a stream of thought note-pattern", 
			" to be organized effectively."
        );
		new Setting(this.containerEl).setDesc(descHeading);
		
		this.add_search_root();

		new Setting(this.containerEl).setName("General Settings").setHeading();
		this.create_daily_note_on_need();
		this.create_nested_folders_setting();
		this.create_note_links_setting();
	
		this.create_regex_select_setting();
		this.create_file_ignore_setting();
		this.add_history_settings();
		this.toggle_historical_links_setting();
	}

	add_search_root(): void {
		
		// Dropdown select of files
		new Setting(this.containerEl).setName("Root Search Folders").setHeading();
		const descRegexIgnore = document.createDocumentFragment();
		descRegexIgnore.append(
			"Add folders to sort"
		);

		new Setting(this.containerEl)
			.setName("Folders to search from")
			.setDesc(descRegexIgnore)
	
		this.plugin.settings.searchFolders.forEach((folder, index) => {
			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FolderSuggest(
						this.app,
						cb.inputEl
					);
					cb.setPlaceholder("Example: folder1/newfolder")
						.setValue(folder)
						.onChange((new_folder) => {
							if (
								new_folder &&
								this.plugin.settings.searchFolders.contains(
									new_folder
								)
							) {
								log_error(
									new FileSorterError(
										"This startup template already exist"
									)
								);
								return;
							}
							this.plugin.settings.searchFolders[index] =
								new_folder;
							this.plugin.saveSettings();
						});
					// @ts-ignore
					// cb.containerEl.addClass("templater_search");
				})
				.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip("Delete")
						.onClick(() => {
							this.plugin.settings.searchFolders.splice(
								index,
								1
							);
							this.plugin.saveSettings();
							// Force refresh
							this.display();
						});
				});
			s.infoEl.remove();
		});

		new Setting(this.containerEl).addButton((cb) => {
			cb.setButtonText("Add new startup template")
				.setCta()
				.onClick(() => {
					this.plugin.settings.searchFolders.push("");
					this.plugin.saveSettings();
					// Force refresh
					this.display();
				});
		});
    }

	create_daily_note_on_need(): void {
		// Setting to create a daily note for you if you haven't created one for the linked note
		const descCreateDailyNote = document.createDocumentFragment();
		descCreateDailyNote.append(
			"This creates a daily note when there is no existing daily note. If false, file is placed in daily folder and not linked."
		)

		new Setting(this.containerEl)
			.setName("Create a daily note if needed")
			.setDesc(descCreateDailyNote)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createDailyNote)
					.onChange((create_daily_note) => {
						this.plugin.settings.createDailyNote =
						create_daily_note;
						this.plugin.saveSettings();
						this.display();
					})
			})

	}

	create_nested_folders_setting(): void {
		// Create Nested Folders Setting
		const descNestDailyNote = document.createDocumentFragment();
        descNestDailyNote.append(
			"This creates a default daily note folder for you based on the date.", 
			descNestDailyNote.createEl("strong", { text: 
				["\nThis will only create a nested folder in cases where ",
				"there is more than one note on a day."]
				.join("")
				}
			),
        );

		new Setting(this.containerEl)
			.setName("Create nested daily notes folder")
			.setDesc(descNestDailyNote)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createNestedDailyFolders)
					.onChange((create_nested_folders) => {
						this.plugin.settings.createNestedDailyFolders =
							create_nested_folders;
						this.plugin.saveSettings();
						this.display();
					})
			})
	}
	
	create_note_links_setting(): void {
		// Create links between notes
		const descAddNoteLink = document.createDocumentFragment();
        descAddNoteLink.append(
			"Add links between notes depending on where they are moved. If you move a new note to a certain day folder,",
			" it will link to that daily note."
        );

		new Setting(this.containerEl)
			.setName("Link notes to daily notes")
			.setDesc(descAddNoteLink)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.addNoteLinks)
					.onChange((add_note_links) => {
						this.plugin.settings.addNoteLinks =
							add_note_links;
						this.plugin.saveSettings();
						this.display();
					})
			})
	}
		
	create_regex_select_setting(): void {
		// Create Regex to select files to move
		const descRegexIgnore = document.createDocumentFragment();
		descRegexIgnore.append(
			"Add a regex string to use to isolate files that you want to move into your daily folder. ", 
			descRegexIgnore.createEl("i", { text:"If you want to select all files, leave blank." }),
			"\nThis setting does not take precedence over the 'Ignore files' list."
		);
		new Setting(this.containerEl)
			.setName("Isolate files to move via Regex")
			.setDesc(descRegexIgnore)
			.addText((input) => {
				input
					.setValue((this.plugin.settings.addFilesRegexVal || ""))
					.onChange((val) => {
						this.plugin.settings.addFilesRegexVal =
							val;
						if (this.plugin.settings.addFilesRegexVal != undefined && this.plugin.settings.addFilesRegexVal != "") {
							this.plugin.settings.addFilesRegex =
								new RegExp(this.plugin.settings.addFilesRegexVal);
						} 
						this.plugin.saveSettings();
					})
			});
		}
		
	create_file_ignore_setting(): void {

		// Dropdown select of files
		const descRegexIgnore = document.createDocumentFragment();
		descRegexIgnore.append(
			"Add a regex string to use to isolate files that you want to move into your daily folder. ", 
			descRegexIgnore.createEl("i", { text:"If you want to select all files, leave blank." }),
			"\nThis setting does not take precedence over the 'Ignore files' list."
		);

		new Setting(this.containerEl)
			.setName("Files to exclude from moving")
			.setDesc(descRegexIgnore)
	
		this.plugin.settings.ignoreFiles.forEach((file, index) => {
			const s = new Setting(this.containerEl)
				.addSearch((cb) => {
					new FileSuggest(
						cb.inputEl,
						this.plugin,
						FileSuggestMode.TemplateFiles
					);
					cb.setPlaceholder("Example: folder1/template_file")
						.setValue(file)
						.onChange((new_file) => {
							if (
								new_file &&
								this.plugin.settings.ignoreFiles.contains(
									new_file
								)
							) {
								log_error(
									new FileSorterError(
										"This startup template already exist"
									)
								);
								return;
							}
							this.plugin.settings.ignoreFiles[index] =
								new_file;
							this.plugin.saveSettings();
						});
					// @ts-ignore
					// cb.containerEl.addClass("templater_search");
				})
				.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip("Delete")
						.onClick(() => {
							this.plugin.settings.ignoreFiles.splice(
								index,
								1
							);
							this.plugin.saveSettings();
							// Force refresh
							this.display();
						});
				});
			s.infoEl.remove();
		});

		new Setting(this.containerEl).addButton((cb) => {
			cb.setButtonText("Add new startup template")
				.setCta()
				.onClick(() => {
					this.plugin.settings.ignoreFiles.push("");
					this.plugin.saveSettings();
					// Force refresh
					this.display();
				});
		});
    }

	toggle_historical_links_setting(): void {
		// Whether or not to add historical notes
		const descCreateHistoricals = document.createDocumentFragment();
        descCreateHistoricals.append(
			"Toggle options to add additional links between files based on modified dates and times."
        );

		new Setting(this.containerEl)
			.setName("Create Historical Notes")
			.setDesc(descCreateHistoricals)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.createHistoryNotes)
					.onChange((create_history_notes) => {
						this.plugin.settings.createHistoryNotes =
							create_history_notes;
						this.plugin.saveSettings();
						this.display();
					})
			});
	}
	
	add_history_settings(): void {
        new Setting(this.containerEl).setName("History Settings").setHeading();

		const descSettingHeading = document.createDocumentFragment();
        descSettingHeading.append(
            "Folder templates are triggered when a new ",
            descSettingHeading.createEl("strong", { text: "empty " }),
            "file is created in a given folder.",
            descSettingHeading.createEl("br"),
            "Templater will fill the empty file with the specified template.",
            descSettingHeading.createEl("br"),
            "The deepest match is used. A global default template would be defined on the root ",
            descSettingHeading.createEl("code", { text: "/" }),
            "."
        );
	}

	create_history_last_modified_template(): void {
		// Whether or not to append last modified to current date
		const descCreateHistoricals = document.createDocumentFragment();
		descCreateHistoricals.append(
			"Template for where to append the 'Last Modified Section' inside the daily note"
		);

		new Setting(this.containerEl)
			.setName("Create Historical Notes")
			.setDesc(descCreateHistoricals)
			.addTextArea((input) => {
				input
					.setValue(this.plugin.settings.history_notes.historySectionTemplate)
					.onChange((history_template) => {
						this.plugin.settings.history_notes.historySectionTemplate =
							history_template;
					})
			})
			.addExtraButton((sb) => {
				sb.setIcon("save")
					.setTooltip("Save Template")
					.onClick(() => {
						if (this.plugin.settings.addFilesRegexVal != undefined && this.plugin.settings.addFilesRegexVal != "") {
							this.plugin.settings.addFilesRegex =
								new RegExp(this.plugin.settings.addFilesRegexVal);
						} 
						this.plugin.saveSettings();
						new Notice("Saved Setting for Output Template")
						// Force refresh
						this.display();
					});
			});
	}
} 