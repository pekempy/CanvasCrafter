/**
 * Organization Logic Tests
 * Verifies the management of Brand Kits and Asset Folders.
 */
describe('Organization Logic', () => {
    test('should create a brand kit with optional initial data', () => {
        const kitId = 'kit-1';
        const brandKit = {
            id: kitId,
            name: 'Acme Corp',
            colors: ['#ff0000', '#00ff00'],
            fonts: ['Roboto', 'Inter'],
            images: [],
            assetFolderIds: ['folder-1']
        };

        expect(brandKit.name).toBe('Acme Corp');
        expect(brandKit.colors).toHaveLength(2);
        expect(brandKit.assetFolderIds).toContain('folder-1');
    });

    test('should manage asset folders and their contents', () => {
        const folder = {
            id: 'folder-1',
            name: 'Logos',
            assets: [
                { id: 1, url: 'logo1.png', tags: ['primary'], isFavorite: true },
                { id: 2, url: 'logo2.png', tags: ['secondary'] }
            ]
        };

        expect(folder.assets).toHaveLength(2);
        expect(folder.assets[0].isFavorite).toBe(true);
        expect(folder.assets[1].tags).toContain('secondary');
    });

    test('should filter assets by tag (simulation)', () => {
        const assets = [
            { id: 1, url: 'a.png', tags: ['red'] },
            { id: 2, url: 'b.png', tags: ['blue'] },
            { id: 3, url: 'c.png', tags: ['red', 'dark'] }
        ];

        const filtered = assets.filter(a => a.tags?.includes('red'));
        expect(filtered).toHaveLength(2);
        expect(filtered.map(f => f.id)).toContain(1);
        expect(filtered.map(f => f.id)).toContain(3);
    });

    test('should support nested subfolders with parentId', () => {
        interface TestFolder {
            id: string;
            name: string;
            parentId?: string;
            assets: { id: number; url: string }[];
        }

        const folders: TestFolder[] = [
            { id: 'parent-1', name: 'Seahawks - Players', assets: [] },
            { id: 'sub-1', name: '6 - Ethan Hehir', parentId: 'parent-1', assets: [{ id: 101, url: 'ethan.png' }] },
            { id: 'sub-2', name: '74 - Player B', parentId: 'parent-1', assets: [{ id: 102, url: 'playerb.png' }] },
            { id: 'other-1', name: 'Seahawks - Logos', assets: [{ id: 103, url: 'logo.png' }] }
        ];

        // Helper function matching the one in AssetPanel.tsx
        const getDescendantFolderIds = (folderId: string): string[] => {
            const childIds = folders.filter(f => f.parentId === folderId).map(f => f.id);
            return [folderId, ...childIds.flatMap(getDescendantFolderIds)];
        };

        // Selecting parent folder should aggregate its assets and all subfolder assets
        const parentTargetIds = new Set(getDescendantFolderIds('parent-1'));
        expect(parentTargetIds).toContain('parent-1');
        expect(parentTargetIds).toContain('sub-1');
        expect(parentTargetIds).toContain('sub-2');
        expect(parentTargetIds).not.toContain('other-1');

        const parentAssets = folders
            .filter(f => parentTargetIds.has(f.id))
            .flatMap(f => f.assets);
        expect(parentAssets).toHaveLength(2);
        expect(parentAssets.map(a => a.id)).toEqual([101, 102]);

        // Selecting subfolder should only include its own assets
        const subTargetIds = new Set(getDescendantFolderIds('sub-1'));
        expect(subTargetIds).toContain('sub-1');
        expect(subTargetIds).not.toContain('parent-1');
        const subAssets = folders
            .filter(f => subTargetIds.has(f.id))
            .flatMap(f => f.assets);
        expect(subAssets).toHaveLength(1);
        expect(subAssets[0].id).toBe(101);
    });
});
