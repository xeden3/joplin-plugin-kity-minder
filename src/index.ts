import joplin from 'api';
import { v4 as uuidv4 } from 'uuid';
import { ContentScriptType, SettingItemType, MenuItem, MenuItemLocation } from 'api/types'
import { isDiagramResource } from './resources'
import { createDiagramResource, getDiagramResource, updateDiagramResource } from './resources';
import { ToolbarButtonLocation } from 'api/types';
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    ContentScriptId: 'mindmap-content-script',
	DiagramsCacheFolder: `${tmpdir}${sep}joplin-minder-plugin${sep}`,
}

const CommandsId = {
    NewMindmap: 'NewMindmap',
}

// 插入markdown语句
function diagramMarkdown(diagramId: string) {
    return `![mindmap](:/${diagramId})`
}

// 创建dlg内嵌form
function buildDialogHTML(diagramBody: string, language: string): string {
	return `
		<form name="main">
			<input type="" id="mindmap_diagram_json" name="mindmap_diagram_json" value='${diagramBody}'>
			<input type="" id="mindmap_diagram_png" name="mindmap_diagram_png" value=''>
			<input type="" id="mindmap_diagram_language" name="mindmap_diagram_language" value='${language}'>
		</form>
		`
}

function clearDiskCache(): void {
    fs.emptyDirSync(Config.DiagramsCacheFolder)
}

joplin.plugins.register({
	onStart: async function() {

		const app_path = await joplin.plugins.installationDir();

        // Clean and create cache folder
        clearDiskCache()

        // Content Scripts
        await joplin.contentScripts.register(
            ContentScriptType.MarkdownItPlugin,
            Config.ContentScriptId,
            './contentScript/contentScript.js',
        )

        /**
         * Messages handling
         */
		 await joplin.contentScripts.onMessage(Config.ContentScriptId, async (request: { diagramId: string, action: string }) => {
            console.log('contentScripts.onMessage Input:', request)
            switch (request.action) {
                case 'edit':
					let diagramResource = await getDiagramResource(request.diagramId);
					let data_json = diagramResource.data_json;
					await open_edit_dlg(data_json, request.diagramId, "edit");
                    return
                case 'check':
                    return { isValid: await isDiagramResource(request.diagramId) }
                default:
                    return `Invalid action: ${request.action}`
            }
        })

		async function open_edit_dlg(data_json:string, diagramId:string, type:string="addnew"){
			let dialogs = joplin.views.dialogs;
			let language = await joplin.settings.value('language') as string;
			let handle_dlg = await dialogs.create(`myDialog2-${uuidv4()}`);

			let header = buildDialogHTML(data_json, language);
			console.log("header", header);
			let iframe = `<iframe id="mindmap_iframe" style="position:absolute;border:0;width:100%;height:100%;" src="${app_path}\\local-kity-minder\\index.html" title="description"></iframe>`
			await dialogs.setHtml(handle_dlg, header + iframe);
			await dialogs.setButtons(handle_dlg, [
				{ id: 'ok', title: 'Save' },
				{ id: 'cancel', title: 'Close' }
			]);

			let tmpDlg: any = dialogs; // Temporary cast to use new properties.
			await tmpDlg.setFitToContent(handle_dlg, false);
			let dialogResult = await dialogs.open(handle_dlg);
			if (dialogResult.id === 'ok') {
				console.log(dialogResult.formData.main.mindmap_diagram_json);
				console.log(dialogResult.formData.main.mindmap_diagram_png);
				if(type==="addnew"){
					let diagramId_new = await createDiagramResource(dialogResult.formData.main.mindmap_diagram_png, dialogResult.formData.main.mindmap_diagram_json)
					await joplin.commands.execute('insertText', diagramMarkdown(diagramId_new))
					let diagramResource = await getDiagramResource(diagramId_new)
					console.log(diagramResource.body);
				}else{
					let newDiagramId = await updateDiagramResource(diagramId, dialogResult.formData.main.mindmap_diagram_png, dialogResult.formData.main.mindmap_diagram_json)
					let note = await joplin.workspace.selectedNote();
					if (note) {
						let newBody = (note.body as string).replace(new RegExp(`!\\[mindmap\\]\\(:\\/${diagramId}\\)`, 'gi'), diagramMarkdown(newDiagramId))
						await joplin.data.put(['notes', note.id], null, { body: newBody })
						await joplin.commands.execute("editor.setText", newBody);
					}
				}
			}
		}

		
		await joplin.settings.registerSettings({
			'language': {
				value: 'en',
				isEnum: true,
				options: {
					'en': 'English',
					'zh-cn': '简体中文',
				},
				type: SettingItemType.String,
				section: 'settings.kityminder',
				public: true,
				label: 'Language',
				description: `You can choose the language you need, including English, Chinese, etc.`
			},
		});
		

		
		await joplin.settings.registerSection('settings.kityminder', {
			label: 'Kity Minder',
			iconName: 'fas fa-brain'
		});
		


        // Register command
        await joplin.commands.register({
            name: CommandsId.NewMindmap,
            label: 'Create new mindmap',
            iconName: 'fas fa-brain',
            execute: async () => {
                await open_edit_dlg("", null);
            },
        });

        // Register menu
        const commandsSubMenu: MenuItem[] = Object.values(CommandsId).map(command => ({ commandName: command }));
        await joplin.views.menus.create('menu-kityminder', 'Kity Minder', commandsSubMenu, MenuItemLocation.Tools);
		
		// 通过按键来新增思维导图
		await joplin.commands.register({
			name: 'addnewMindmap',
			label: 'Create new mindmap',
			iconName: 'fas fa-brain',
			execute: async () => {
				await open_edit_dlg("", null);
			},
		});
		await joplin.views.toolbarButtons.create('addnewMindmap', 'addnewMindmap', ToolbarButtonLocation.NoteToolbar);
	},
});
