import joplin from 'api'
import { v4 as uuidv4 } from 'uuid'
import { tmpdir } from 'os'
import { sep } from 'path'
const fs = joplin.require('fs-extra')

const Config = {
    TempFolder: `${tmpdir}${sep}joplin-drawio-plugin${sep}`,
    DataImageRegex: /^data:image\/(?<extension>png|svg)(?:\+xml)?;base64,(?<blob>.*)/,
    TitlePrefix: 'drawio-',
}

export interface IDiagramOptions {
    sketch?: boolean
}

function generateId() {
    return uuidv4().replace(/-/g, '')
}

function buildTitle(options: any): string {
    return Config.TitlePrefix + JSON.stringify(options)
}
function parseTitle(title: string): any {
    return JSON.parse(title.replace(Config.TitlePrefix, ''))
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

export async function getDiagramResource(diagramId: string): Promise<{ body: string, options: IDiagramOptions, data_json:string }> {
    const resourceProperties = await joplin.data.get(['resources', diagramId])
    const resourceData = await joplin.data.get(['resources', diagramId, 'file'])
    const resourceData_json = await joplin.data.get(['notes', diagramId], { fields: ['id', 'title', 'body'] })
    
    console.log('getDiagramResource', resourceProperties, resourceData)

    if (!resourceData.contentType.startsWith('image')) {
        throw new Error('Invalid resource content type. The resource must be an image')
    }

    let options: IDiagramOptions = {}
    let data_json = ""
    try {
        options = parseTitle(resourceProperties.title)
    } catch (e) {
        console.warn('getDiagramResource - Option parsing failed:', e)
    }

    console.log('getDiagramResource diagramId', diagramId);
    console.log('getDiagramResource json', resourceData_json.body);
    return {
        body: `data:${resourceData.contentType};base64,${Buffer.from(resourceData.body).toString('base64')}`,
        options: options,
        data_json: resourceData_json.body
    }
}

export async function createDiagramResource(data: string, options: IDiagramOptions, data_json:string): Promise<string> {
    const diagramId = generateId()
    // const diagramId_json = generateId()
    const filePath = await writeTempFile(diagramId, data)
    // const filePath_json = await writeJsonFile(diagramId, data_json)
    const createdResource = await joplin.data.post(['resources'], null, { id: diagramId, title: buildTitle(options) }, [{ path: filePath }])
    const createdResource_json = await joplin.data.post(['notes'], null, { id: diagramId, body: data_json })
    // console.log('createdResource', createdResource)
    // console.log('createdResource', createdResource_json)
    console.log('createResource diagramId', diagramId);
    console.log('createResource json', data_json);
    return diagramId
}

export async function updateDiagramResource(diagramId: string, data: string, options: IDiagramOptions, data_json:string ): Promise<string> {
    const newDiagramId = generateId()
    const filePath = await writeTempFile(newDiagramId, data)
    const createdResource = await joplin.data.post(['resources'], null, { id: newDiagramId, title: buildTitle(options) }, [{ path: filePath }])
    const createdResource_json = await joplin.data.post(['notes'], null, { id: newDiagramId, body: data_json })
    // I will not delete the previous resource just in case it has been copied in another note
    // await joplin.data.delete(['resources', diagramId])
    // console.log('createdResource', createdResource)
    return newDiagramId
}

export async function isDiagramResource(diagramId: string): Promise<boolean> {
    const resourceProperties = await joplin.data.get(['resources', diagramId])
    return resourceProperties.title.startsWith(Config.TitlePrefix)
}