import joplin from 'api'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    TempFolder: `${tmpdir}${sep}joplin-mindmap-plugin${sep}`,
    DataImageRegex: /^data:image\/(?<extension>png|svg)(?:\+xml)?;base64,(?<blob>.*)/,
    TitlePrefix: 'mindmap-',
}

export interface IDiagramOptions {
    sketch?: boolean
}

function generateId() {
    return uuidv4().replace(/-/g, '')
}

function buildTitle(json_resource_id: string): string {
    return Config.TitlePrefix + json_resource_id
}
function parseTitle(title: string): any {
    return title.replace(Config.TitlePrefix, '')
}

export function clearDiskCache(): void {
    fs.rmdirSync(Config.TempFolder, { recursive: true })
    fs.mkdirSync(Config.TempFolder, { recursive: true })
}

async function writeTempFile(name: string, data: string, filePath: string = null): Promise<string> {
    const matches = data.match(Config.DataImageRegex)
    if (!matches) {
        throw new Error('Invalid image data')
    }
    if (!filePath) {
        filePath = `${Config.TempFolder}${name}.${matches.groups.extension}`
    }
    await fs.writeFile(filePath, matches.groups.blob, 'base64')
    return filePath
}


async function writeJsonFile(name: string, data: string, filePath: string = null): Promise<string> {
    if (!filePath) {
        filePath = `${Config.TempFolder}${name}.json`
    }
    await fs.writeFile(filePath, data)
    return filePath
}


async function readJsonFile(name: string): Promise<string> {
    let filePath = `${Config.TempFolder}${name}.json`
    let data = await fs.readFile(filePath)
    return data
}

export async function getDiagramResource(diagramId: string): Promise<{ body: string, data_json:string }> {
    let resourceProperties = await joplin.data.get(['resources', diagramId])
    let resourceData = await joplin.data.get(['resources', diagramId, 'file'])

    let json_resource_id: string = ""
    try {
        json_resource_id = parseTitle(resourceProperties.title)
    } catch (e) {
        console.warn('getDiagramResource - json resource ID parsing failed:', e)
    }

    let resourceData_json = await joplin.data.get(['resources', json_resource_id, 'file'])
    let data_json = new TextDecoder().decode(resourceData_json.body);
    console.log('getDiagramResource', resourceProperties, resourceData)
    if (!resourceData.contentType.startsWith('image')) {
        throw new Error('Invalid resource content type. The resource must be an image')
    }
    console.log('getDiagramResource diagramId', diagramId);
    console.log('getDiagramResource json', data_json);
    return {
        body: `data:${resourceData.contentType};base64,${Buffer.from(resourceData.body).toString('base64')}`,
        data_json: data_json
    }
}

export async function createDiagramResource(data: string, data_json:string): Promise<string> {
    let diagramId = generateId()
    let json_resource_id = generateId()

    let filePath = await writeTempFile(diagramId, data)
    let filePath_json = await writeJsonFile(json_resource_id, data_json)
    let createdResource = await joplin.data.post(['resources'], null, { id: diagramId, title: buildTitle(json_resource_id) }, [{ path: filePath }])
    let createdResource_json = await joplin.data.post(['resources'], null, { id: json_resource_id, title: "mindmap-data-json"}, [{path: filePath_json}])

    console.log('createResource diagramId', diagramId);
    console.log('createResource json', data_json);
    return diagramId
}

export async function updateDiagramResource(diagramId: string, data: string, data_json:string ): Promise<string> {
    let newDiagramId = generateId()
    let new_json_resource_id = generateId()

    let filePath = await writeTempFile(newDiagramId, data)
    let filePath_json = await writeJsonFile(new_json_resource_id, data_json)
    let createdResource = await joplin.data.post(['resources'], null, { id: newDiagramId, title: buildTitle(new_json_resource_id) }, [{ path: filePath }])
    let createdResource_json = await joplin.data.post(['resources'], null, { id: new_json_resource_id, title: "mindmap-data-json"}, [{path: filePath_json}])
    // let createdResource_json = await joplin.data.post(['notes'], null, { id: newDiagramId, body: data_json })
    // I will not delete the previous resource just in case it has been copied in another note
    // await joplin.data.delete(['resources', diagramId])
    // console.log('createdResource', createdResource)
    return newDiagramId
}

export async function isDiagramResource(diagramId: string): Promise<boolean> {
    let resourceProperties = await joplin.data.get(['resources', diagramId])
    return resourceProperties.title.startsWith(Config.TitlePrefix)
}