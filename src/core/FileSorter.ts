import {
    App,
    MarkdownPostProcessorContext,
    MarkdownView,
    normalizePath,
    TAbstractFile,
    TFile,
    TFolder,
} from "obsidian";
import FileSorterPlugin from "src/main";


export class FileSorter {

	constructor(private plugin: FileSorterPlugin) {}

	async sort_file(): Promise<void> {}

	async update_file(
		file?: TFile | string
	): Promise<TFile | undefined> {
		return

	}

	async convert_file_to_folder(
		filepath?: TFile | string
	): Promise<TFolder | undefined> {
		return
	}

	async create_daily_note(): Promise<TFile> {
	}

	
}