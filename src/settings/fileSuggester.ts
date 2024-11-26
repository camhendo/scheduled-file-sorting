// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import { TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./suggest";
import { get_tfiles_from_folder } from "../utils/utils";
import FileSorterPlugin from "../main";
import { errorWrapperSync } from "../utils/error";

export enum FileSuggestMode {
    TemplateFiles,
    ScriptFiles,
}

export class FileSuggest extends TextInputSuggest<TFile> {
    constructor(
        public inputEl: HTMLInputElement,
        private plugin: FileSorterPlugin,
        private mode: FileSuggestMode
    ) {
        super(plugin.app, inputEl);
    }

    get_folder(folder: string, mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.TemplateFiles:
                return folder;
            case FileSuggestMode.ScriptFiles:
                return folder;
        }
    }

    get_folders(mode: FileSuggestMode): Array<string> {
        switch (mode) {
            case FileSuggestMode.TemplateFiles:
                return this.plugin.settings.searchFolders;
            case FileSuggestMode.ScriptFiles:
                return this.plugin.settings.searchFolders;
        }
    }

    get_error_msg(mode: FileSuggestMode): string {
        switch (mode) {
            case FileSuggestMode.TemplateFiles:
                return `Templates folder doesn't exist`;
            case FileSuggestMode.ScriptFiles:
                return `User Scripts folder doesn't exist`;
        }
    }

    getSuggestions(input_str: string): TFile[] {
        const all_files = errorWrapperSync(
            () => 
                this.get_folders(this.mode)
                .map( (folder, _) => 
                    get_tfiles_from_folder(
                        this.plugin.app,
                        this.get_folder(folder, this.mode)
                    )
                ).flat()
            ,    
            this.get_error_msg(this.mode)
        );
        if (!all_files) {
            return [];
        }

        const files: TFile[] = [];
        const lower_input_str = input_str.toLowerCase();

        all_files.forEach((file: TAbstractFile) => {
            if (
                file instanceof TFile &&
                file.extension === "md" &&
                file.path.toLowerCase().contains(lower_input_str)
            ) {
                files.push(file);
            }
        });

        return files.slice(0, 1000);
    }

    renderSuggestion(file: TFile, el: HTMLElement): void {
        el.setText(file.path);
    }

    selectSuggestion(file: TFile): void {
        this.inputEl.value = file.path;
        this.inputEl.trigger("input");
        this.close();
    }
}