// Helper function to get base path (works for both local and GitHub Pages)
function getBasePath() {
    // Get the pathname (e.g., "/Tomodachi-Life-Visualizer/" or "/" or "/index.html")
    const pathname = window.location.pathname;
    // Remove filename and trailing slash, keep only the directory path
    // For GitHub Pages: "/Tomodachi-Life-Visualizer/" -> "/Tomodachi-Life-Visualizer"
    // For local root: "/" -> ""
    // For local with index.html: "/index.html" -> ""
    const base = pathname.replace(/\/[^\/]*$/, '').replace(/\/$/, '');
    return base || '';
}

document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));

            // Add active class to clicked button and corresponding panel
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Load chord diagram when relationship-web tab is shown
            if (targetTab === 'relationship-web') {
                loadChordDiagram();
            }
        });
    });

    // Load Miis
    loadMiis();

    // Modal close functionality
    const modal = document.getElementById('mii-detail-modal');
    const closeBtn = document.querySelector('.close');

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

async function loadMiis() {
    try {
        console.log('Loading miis...');
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/extracted_miis/_summary.json`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Loaded summary data:', data);
        const miisGrid = document.getElementById('miis-grid');

        if (!miisGrid) {
            console.error('miis-grid element not found!');
            return;
        }

        // Sort miis by index
        const miisArray = Object.values(data.miis).sort((a, b) => a.index - b.index);
        console.log(`Found ${miisArray.length} miis`);

        miisGrid.innerHTML = '';

        miisArray.forEach(mii => {
            const miiBox = document.createElement('div');
            miiBox.className = 'mii-box';
            miiBox.addEventListener('click', () => showMiiDetail(mii));

            // Get folder name from filename
            const folderName = mii.filename.split('/')[0];
            const basePath = getBasePath();
            const imagePath = `${basePath}/extracted_miis/${folderName}/face.png`;

            miiBox.innerHTML = `
                <img src="${imagePath}" alt="${mii.nickname}" class="mii-image">
                <div class="mii-name">${mii.nickname}</div>
            `;

            miisGrid.appendChild(miiBox);
        });

        console.log('Miis loaded successfully');
    } catch (error) {
        console.error('Error loading miis:', error);
        const miisGrid = document.getElementById('miis-grid');
        if (miisGrid) {
            miisGrid.innerHTML = `<p style="color: #666;">Error loading miis: ${error.message}. Make sure you're running a local server (e.g., python3 -m http.server 8000) and accessing via http://localhost:8000</p>`;
        }
    }
}

function isLightColor(hex) {
    // Remove # if present
    hex = hex.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance (perceived brightness)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // If luminance is greater than 0.5, it's a light color
    return luminance > 0.5;
}

function getRelationshipsHTML(relationships, showAll = false) {
    // Custom sort order: Type 4, Type 2, Type 12, Type 3, Type 9, Type 1
    const typeOrder = [4, 2, 12, 3, 9, 1];

    // Type colors (darkened for better readability on white background)
    const typeColors = {
        4: '#c93d6b',   // Spouse - pink
        2: '#c45a6f',   // Lover - light pink
        12: '#c4a020',  // Best friend - yellow
        3: '#606060',   // Ex - gray
        9: '#c93d15',   // Friend (in conflict) - orange
        1: '#2d8a83'    // Friend - teal
    };

    // Convert relationships object to array and filter out type 0
    let relationshipsArray = Object.values(relationships)
        .filter(rel => rel.type !== 0)
        .sort((a, b) => {
            const indexA = typeOrder.indexOf(a.type);
            const indexB = typeOrder.indexOf(b.type);
            // If type not in order, put it at the end
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;

            // First sort by type order
            if (indexA !== indexB) {
                return indexA - indexB;
            }

            // If same type, sort by value (descending - highest value first)
            return (b.value || 0) - (a.value || 0);
        });

    if (relationshipsArray.length === 0) {
        return '<div style="background-color: #fff9c4; padding: 16px; border-radius: 12px; max-width: 400px;"><p>No relationships found.</p></div>';
    }

    const allRelationships = relationshipsArray;
    const topRelationships = relationshipsArray.slice(0, 5);
    const hasMore = allRelationships.length > 5;

    const relationshipsToShow = showAll ? allRelationships : topRelationships;
    const hiddenCount = hasMore && !showAll ? allRelationships.length - 5 : 0;

    let html = '<div style="background-color: #fff9c4; padding: 16px; border-radius: 12px; line-height: 1.8; max-width: 400px;">';

    // Relationships list
    const listId = `relationships-list-${Date.now()}`;
    html += `<div id="${listId}">`;
    relationshipsToShow.forEach(rel => {
        const typeColor = typeColors[rel.type] || '#000000';
        html += `<p style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <strong>${rel.target_name}</strong>
            <strong style="color: ${typeColor}; letter-spacing: 1px;">${rel.type_name}</strong>
        </p>`;
    });
    html += '</div>';

    // Expand/collapse arrow
    if (hasMore) {
        const arrowId = `relationships-arrow-${Date.now()}`;
        const hiddenId = `relationships-hidden-${Date.now()}`;
        const arrowSymbol = showAll ? '▼' : '▶';

        // Hidden relationships (if collapsed)
        if (!showAll) {
            html += `<div id="${hiddenId}" style="display: none;">`;
            allRelationships.slice(5).forEach(rel => {
                const typeColor = typeColors[rel.type] || '#000000';
                html += `<p style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                    <strong>${rel.target_name}</strong>
                    <strong style="color: ${typeColor}; letter-spacing: 1px;">${rel.type_name}</strong>
                </p>`;
            });
            html += '</div>';
        }

        html += `<p style="margin-top: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px;" onclick="toggleRelationships('${listId}', '${hiddenId}', '${arrowId}', ${allRelationships.length})">
            <span id="${arrowId}" style="font-size: 12px;">${arrowSymbol}</span>
            <span style="font-size: 14px;">${showAll ? 'Show less' : `Show ${hiddenCount} more`}</span>
        </p>`;
    }

    html += '</div>';

    return html;
}

function toggleRelationships(listId, hiddenId, arrowId, totalCount) {
    const listDiv = document.getElementById(listId);
    const hiddenDiv = document.getElementById(hiddenId);
    const arrowSpan = document.getElementById(arrowId);

    if (hiddenDiv && hiddenDiv.style.display === 'none') {
        // Expand: show all relationships
        hiddenDiv.style.display = 'block';
        arrowSpan.textContent = '▼';
        arrowSpan.parentElement.querySelector('span:last-child').textContent = 'Show less';
    } else if (hiddenDiv) {
        // Collapse: show only top 5
        hiddenDiv.style.display = 'none';
        arrowSpan.textContent = '▶';
        arrowSpan.parentElement.querySelector('span:last-child').textContent = `Show ${totalCount - 5} more`;
    }
}

function getPersonalityDescriptions(personalityType) {
    const mainTypes = {
        'EASYGOING': {
            overall: 'Relaxed, open minded, empathetic.',
            character: 'Does things at his/her own pace in a genuinely honest and kind manner.',
            color: '#febe28'
        },
        'INDEPENDENT': {
            overall: 'Creative, self-reliant, somewhat reserved.',
            character: 'Comfortable doing his/her own thing and thinking outside the box.',
            color: '#67ab8c'
        },
        'OUTGOING': {
            overall: 'Social, charming, energetic.',
            character: 'Comfortable in almost any situation, and makes new connections easily.',
            color: '#fc7976'
        },
        'CONFIDENT': {
            overall: 'Organized, motivated, focused.',
            character: 'Tackles any challenge head-on, and has great faith in his/her own abilities.',
            color: '#8d9fff'
        }
    };

    const subtypes = {
        'Softie': {
            description: 'Sensitive, emotional, and very in tune with the feelings of those around him/her. Empathetic, and also quite sentimental.',
            color: '#fdaba8'
        },
        'Optimist': {
            description: 'Positive, enthusiastic, and always beaming. He/she smiles at everyone, and loves to make sure everyone else has a good time too.',
            color: '#ff9695'
        },
        'Buddy': {
            description: 'Trustworthy and considerate. Puts his/her friends first, and works hard to make sure everyone gets along with each other.',
            color: '#ffe761'
        },
        'Dreamer': {
            description: 'Idealistic and romantic. Often has his/her head in the clouds… but also comes up with a lot of great ideas as a result.',
            color: '#ffc740'
        },
        'Free Spirit': {
            description: 'Unique, carefree, and creative. Laid back and does things his/her own way. Self-reliant and always thinking way outside the box.',
            color: '#63a064'
        },
        'Artist': {
            description: 'Imaginative and inspired. Happiest when creating something. Able to find beauty in everyone and everything around him/her.',
            color: '#63be44'
        },
        'Lone Wolf': {
            description: 'Self-sufficient and highly individual. Doesn\'t show a lot of emotion, but has a lot going on deep down.',
            color: '#598181'
        },
        'Thinker': {
            description: 'Thoughtful and introspective. Great at thinking things all the way through and analyzing issues from every angle.',
            color: '#599495'
        },
        'Trendsetter': {
            description: 'Radiant and always on form. Has an effortless style that is admired by all. Able to easily adapt to new situations.',
            color: '#ff1e83'
        },
        'Entertainer': {
            description: 'Bold and captivating. Able to light up a room with his/her wit and charm. There\'s never a dull moment when he/she\'s around.',
            color: '#f00001'
        },
        'Charmer': {
            description: 'Outgoing and extremely pleasant to be around. Able to make friends easily and turn almost any problem into a positive situation.',
            color: '#ff6e00'
        },
        'Leader': {
            description: 'Assertive and highly regarded. Has great faith in his/her own instincts, and has no trouble earning the respect of others.',
            color: '#ff5100'
        },
        'Designer': {
            description: 'Diligent, productive, and highly efficient. A master at coming up with a plan and putting that plan into action.',
            color: '#0196fc'
        },
        'Adventurer': {
            description: 'Risk taking and ambitious. Full of energy, and does almost everything with a sense of purpose and excitement. Once started, nobody can stop him/her!',
            color: '#945bf8'
        },
        'Brainiac': {
            description: 'Highly intelligent and not afraid to show it. Knowledgeable about a wide array of subjects, and confident answering almost any question.',
            color: '#0065ff'
        },
        'Go-getter': {
            description: 'A determined self-starter. Cuts his/her own path in life, and doesn\'t let anything stand in his/her way. Quick and daring to jump into action.',
            color: '#5a3df9'
        }
    };

    const parts = personalityType.split(' ');
    const mainType = parts[0].toUpperCase();
    const subtypeKey = parts.slice(1).join(' ');

    // Find matching subtype (case-insensitive)
    const subtypeMatch = Object.keys(subtypes).find(key =>
        key.toLowerCase() === subtypeKey.toLowerCase()
    );
    const subtype = subtypeMatch ? subtypes[subtypeMatch] : null;
    const subtypeName = subtypeMatch || subtypeKey;

    return {
        mainType: mainTypes[mainType] || null,
        subtype: subtype,
        mainTypeName: mainType,
        subtypeName: subtypeName
    };
}

async function showMiiDetail(mii) {
    try {
        const basePath = getBasePath();
        const response = await fetch(`${basePath}/extracted_miis/${mii.filename}`);
        const miiData = await response.json();
        const detailContent = document.getElementById('mii-detail-content');
        const modal = document.getElementById('mii-detail-modal');

        const folderName = mii.filename.split('/')[0];
        const faceImagePath = `${basePath}/extracted_miis/${folderName}/face.png`;
        const bodyImagePath = `${basePath}/extracted_miis/${folderName}/body.png`;

        const personalityInfo = getPersonalityDescriptions(miiData.personality.type);

        let personalityHTML = `
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 20px;">Personality</h2>
                <div style="display: flex; flex-direction: column; gap: 15px;">
        `;

        if (personalityInfo.mainType) {
            const mainTypeDisplay = personalityInfo.mainTypeName.charAt(0) + personalityInfo.mainTypeName.slice(1).toLowerCase();
            const isMainTypeLight = isLightColor(personalityInfo.mainType.color);
            const mainTextColor = isMainTypeLight ? '#000000' : '#ffffff';
            const mainTextShadow = isMainTypeLight ? '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' : '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

            personalityHTML += `
                <div class="personality-box" style="background-color: ${personalityInfo.mainType.color}; padding: 16px; border-radius: 12px; color: ${mainTextColor};">
                    <p class="personality-subtype" style="font-size: 18px; font-weight: 600; margin-bottom: 8px; text-shadow: ${mainTextShadow};">${mainTypeDisplay}</p>
                    <p style="font-size: 14px; line-height: 1.6; margin-bottom: 4px;"><strong>Overall:</strong> ${personalityInfo.mainType.overall}</p>
                    <p style="font-size: 14px; line-height: 1.6;"><strong>Character:</strong> ${personalityInfo.mainType.character}</p>
                </div>
            `;
        }

        if (personalityInfo.subtype) {
            const isSubtypeLight = isLightColor(personalityInfo.subtype.color);
            const subTextColor = isSubtypeLight ? '#000000' : '#ffffff';
            const subTextShadow = isSubtypeLight ? '-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff' : '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';

            personalityHTML += `
                <div class="personality-box" style="background-color: ${personalityInfo.subtype.color}; padding: 16px; border-radius: 12px; color: ${subTextColor};">
                    <p class="personality-subtype" style="font-size: 18px; font-weight: 600; margin-bottom: 8px; text-shadow: ${subTextShadow};">${personalityInfo.subtypeName}</p>
                    <p style="font-size: 14px; line-height: 1.6;">${personalityInfo.subtype.description}</p>
                </div>
            `;
        }

        personalityHTML += `
                </div>
            </div>
        `;

        // Format name with nickname if different
        let fullName = miiData.profile.firstname;
        if (miiData.profile.nickname && miiData.profile.nickname.toLowerCase() !== miiData.profile.firstname.toLowerCase()) {
            fullName = `${miiData.profile.firstname} '${miiData.profile.nickname}'`;
        }
        fullName += ` ${miiData.profile.lastname}`;

        detailContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-size: 32px; font-weight: 400; margin-bottom: 20px;">${miiData.profile.nickname}</h1>
                <div style="display: flex; gap: 20px; justify-content: center; margin-bottom: 30px;">
                    <img src="${faceImagePath}" alt="Face" style="width: 200px; height: 200px; border-radius: 8px;">
                    <img src="${bodyImagePath}" alt="Body" style="width: 200px; height: 200px; border-radius: 8px;">
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 15px;">Profile</h2>
                <div style="line-height: 1.8;">
                    <p><strong>${fullName}</strong></p>
                    <p><strong>Creator:</strong> ${miiData.profile.creator}</p>
                </div>
            </div>
            
            ${personalityHTML}
            
            <div>
                <h2 style="font-size: 20px; font-weight: 400; margin-bottom: 15px;">Relationships</h2>
                ${getRelationshipsHTML(miiData.relationships)}
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        console.error('Error loading mii detail:', error);
    }
}

// Relationship Web / Chord Diagram Functions
let allMiisData = null;
let relationshipMatrix = null;
let miiIndexMap = null;
let cachedRelationshipData = null;
let cachedFilteredMiis = null;

async function loadChordDiagram() {
    const container = document.getElementById('chord-diagram-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = '<p style="text-align: center; color: #666;">Loading relationship data...</p>';

    try {
        // Load summary data
        const basePath = getBasePath();
        const summaryResponse = await fetch(`${basePath}/extracted_miis/_summary.json`);
        if (!summaryResponse.ok) throw new Error(`HTTP error! status: ${summaryResponse.status}`);
        const summaryData = await summaryResponse.json();

        // Sort miis by index
        const miisArray = Object.values(summaryData.miis).sort((a, b) => a.index - b.index);

        // Create index map: nickname -> array index
        miiIndexMap = new Map();
        miisArray.forEach((mii, index) => {
            miiIndexMap.set(mii.nickname, index);
        });

        // Load all Mii data
        allMiisData = [];
        for (const mii of miisArray) {
            try {
                const miiResponse = await fetch(`${basePath}/extracted_miis/${mii.filename}`);
                if (miiResponse.ok) {
                    const miiData = await miiResponse.json();
                    allMiisData.push({
                        ...mii,
                        data: miiData
                    });
                }
            } catch (err) {
                console.error(`Error loading ${mii.filename}:`, err);
            }
        }

        // Validate we have data
        if (!allMiisData || allMiisData.length === 0) {
            throw new Error('No Mii data loaded');
        }

        // Filter out people with no relationships
        // First pass: find people who have at least one valid relationship
        let miisWithRelationships = allMiisData.filter(mii => {
            if (!mii.data || !mii.data.relationships) return false;
            const relationships = Object.values(mii.data.relationships);
            // Check if there are any non-zero relationships (excluding self and type 0)
            return relationships.some(rel =>
                rel.type !== 0 &&
                rel.target_name !== mii.nickname &&
                (rel.value || 0) > 0 &&
                miiIndexMap.has(rel.target_name)
            );
        });

        if (miisWithRelationships.length === 0) {
            throw new Error('No Miis with relationships found');
        }

        // Rebuild index map with filtered Miis
        const filteredIndexMap = new Map();
        miisWithRelationships.forEach((mii, index) => {
            filteredIndexMap.set(mii.nickname, index);
        });

        // Second pass: filter to only include people who have relationships to other filtered people
        miisWithRelationships = miisWithRelationships.filter(mii => {
            if (!mii.data || !mii.data.relationships) return false;
            const relationships = Object.values(mii.data.relationships);
            // Check if there are any relationships to people in the filtered list
            return relationships.some(rel =>
                rel.type !== 0 &&
                rel.target_name !== mii.nickname &&
                (rel.value || 0) > 0 &&
                filteredIndexMap.has(rel.target_name)
            );
        });

        // Rebuild index map again with final filtered list
        miiIndexMap = new Map();
        miisWithRelationships.forEach((mii, index) => {
            miiIndexMap.set(mii.nickname, index);
        });

        // Build relationship matrix
        const relationshipData = buildRelationshipMatrix(miisWithRelationships, miiIndexMap);
        relationshipMatrix = relationshipData.matrix;

        // Validate matrix
        if (!relationshipMatrix || relationshipMatrix.length === 0) {
            throw new Error('Failed to build relationship matrix');
        }

        // Cache data for filtering
        cachedRelationshipData = relationshipData;
        cachedFilteredMiis = miisWithRelationships;

        // Set up filter checkboxes
        setupRelationshipFilters();

        // Render chord diagram
        renderChordDiagram(relationshipData, miisWithRelationships, container);

    } catch (error) {
        console.error('Error loading chord diagram:', error);
        container.innerHTML = `<p style="text-align: center; color: #666;">Error loading relationship data: ${error.message}</p>`;
    }
}

function buildRelationshipMatrix(miisData, indexMap) {
    const n = miisData.length;
    // Initialize matrix with zeros
    const matrix = Array(n).fill(0).map(() => Array(n).fill(0));
    // Store relationship type for each connection (use the strongest relationship type)
    const typeMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    // Store relationship info for lookups
    const relationshipInfo = {};

    // Relationship type hierarchy (higher number = higher priority)
    const typePriority = {
        4: 6,   // Spouse - highest priority
        2: 5,   // Lover
        12: 4,  // Best friend
        3: 3,   // Ex
        9: 2,   // Friend (in conflict)
        1: 1    // Friend - lowest priority
    };

    miisData.forEach((mii, sourceIndex) => {
        if (!mii.data || !mii.data.relationships) return;

        // Iterate through all relationships
        Object.values(mii.data.relationships).forEach(rel => {
            // Skip self-relationships and type 0 (Unknown)
            if (rel.type === 0 || rel.target_name === mii.nickname) return;

            const targetIndex = indexMap.get(rel.target_name);
            if (targetIndex !== undefined && targetIndex !== null) {
                // Count relationships (1 per relationship, regardless of value)
                const weight = rel.value || 0;
                if (weight > 0) {
                    matrix[sourceIndex][targetIndex] = 1; // Count as 1 relationship, not sum of values

                    // Store relationship type (prioritize type hierarchy, not value)
                    const key = `${sourceIndex}-${targetIndex}`;
                    const currentPriority = typePriority[rel.type] || 0;
                    const existingPriority = relationshipInfo[key] ? (typePriority[relationshipInfo[key].type] || 0) : 0;

                    // If no existing relationship, or this one has higher priority, use this one
                    if (!relationshipInfo[key] || currentPriority > existingPriority) {
                        relationshipInfo[key] = {
                            type: rel.type,
                            type_name: rel.type_name,
                            value: weight  // Store the value for this specific relationship
                        };
                        typeMatrix[sourceIndex][targetIndex] = rel.type;
                    } else if (currentPriority === existingPriority) {
                        // If same priority type, keep the one with higher value
                        if (weight > (relationshipInfo[key].value || 0)) {
                            relationshipInfo[key].value = weight;
                        }
                    }
                }
            }
        });
    });

    return { matrix, typeMatrix, relationshipInfo };
}

function setupRelationshipFilters() {
    const checkboxes = document.querySelectorAll('.relationship-type-filter');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (cachedRelationshipData && cachedFilteredMiis) {
                const container = document.getElementById('chord-diagram-container');
                const enabledTypes = Array.from(checkboxes)
                    .filter(cb => cb.checked)
                    .map(cb => parseInt(cb.getAttribute('data-type')));

                // Filter the relationship data
                const { filteredData, filteredMiis, newIndexMap } = filterRelationshipData(
                    cachedRelationshipData,
                    cachedFilteredMiis,
                    enabledTypes
                );

                // Re-render
                renderChordDiagram(filteredData, filteredMiis, container);
            }
        });
    });
}

function filterRelationshipData(relationshipData, miisData, enabledTypes) {
    const matrix = relationshipData.matrix;
    const typeMatrix = relationshipData.typeMatrix;
    const relationshipInfo = relationshipData.relationshipInfo;

    const n = matrix.length;
    const filteredMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    const filteredTypeMatrix = Array(n).fill(0).map(() => Array(n).fill(0));
    const filteredRelationshipInfo = {};

    // Only include relationships of enabled types
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const relType = typeMatrix[i][j];
            if (relType !== 0 && enabledTypes.includes(relType)) {
                filteredMatrix[i][j] = matrix[i][j];
                filteredTypeMatrix[i][j] = relType;
                const key = `${i}-${j}`;
                if (relationshipInfo[key]) {
                    filteredRelationshipInfo[key] = relationshipInfo[key];
                }
            }
        }
    }

    // Find people who have no relationships after filtering
    const peopleWithRelationships = new Set();
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (filteredMatrix[i][j] > 0 || filteredMatrix[j][i] > 0) {
                peopleWithRelationships.add(i);
                peopleWithRelationships.add(j);
            }
        }
    }

    // Filter to only include people with relationships
    const indicesToKeep = Array.from(peopleWithRelationships).sort((a, b) => a - b);
    const filteredMiis = indicesToKeep.map(index => miisData[index]);

    // Build new index map
    const newIndexMap = new Map();
    indicesToKeep.forEach((oldIndex, newIndex) => {
        newIndexMap.set(miisData[oldIndex].nickname, newIndex);
    });

    // Build new filtered matrices with only the people who have relationships
    const newN = indicesToKeep.length;
    const newMatrix = Array(newN).fill(0).map(() => Array(newN).fill(0));
    const newTypeMatrix = Array(newN).fill(0).map(() => Array(newN).fill(0));
    const newRelationshipInfo = {};

    indicesToKeep.forEach((oldI, newI) => {
        indicesToKeep.forEach((oldJ, newJ) => {
            if (filteredMatrix[oldI][oldJ] > 0) {
                newMatrix[newI][newJ] = filteredMatrix[oldI][oldJ];
                newTypeMatrix[newI][newJ] = filteredTypeMatrix[oldI][oldJ];
                const oldKey = `${oldI}-${oldJ}`;
                const newKey = `${newI}-${newJ}`;
                if (filteredRelationshipInfo[oldKey]) {
                    newRelationshipInfo[newKey] = filteredRelationshipInfo[oldKey];
                }
            }
        });
    });

    return {
        filteredData: {
            matrix: newMatrix,
            typeMatrix: newTypeMatrix,
            relationshipInfo: newRelationshipInfo
        },
        filteredMiis: filteredMiis,
        newIndexMap: newIndexMap
    };
}

function renderChordDiagram(relationshipData, miisData, container) {
    const matrix = relationshipData.matrix;
    const typeMatrix = relationshipData.typeMatrix;
    const relationshipInfo = relationshipData.relationshipInfo;

    // Validate inputs
    if (!matrix || !miisData || !container) {
        console.error('Invalid parameters for renderChordDiagram');
        return;
    }

    if (!Array.isArray(matrix) || matrix.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No relationship data available.</p>';
        return;
    }

    if (!Array.isArray(miisData) || miisData.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No Mii data available.</p>';
        return;
    }

    // Clear container
    container.innerHTML = '';

    // Size settings - adjust these values to change the graph size:
    // baseSize: base size for the diagram (default: 1000) - increase this to make the graph bigger
    // radiusOffset: offset from center for outer radius (default: 100) - decrease this to make the graph bigger
    // innerRadiusOffset: offset for inner radius from outer radius (default: 40)
    const baseSize = 1000;
    const radiusOffset = 0;
    const innerRadiusOffset = 40;

    // Calculate dimensions with extra space for labels
    const labelOffset = 100; // Extra space for labels extending beyond the circle
    const baseWidth = Math.min(baseSize, window.innerWidth - 80);
    const baseHeight = Math.min(baseSize, window.innerHeight - 80);

    // Make SVG larger to accommodate labels
    const width = baseWidth + labelOffset;
    const height = baseHeight + labelOffset;

    // Calculate radius based on smaller dimension minus label space
    const outerRadius = Math.min(baseWidth, baseHeight) / 2 - radiusOffset;
    const innerRadius = outerRadius - innerRadiusOffset;

    // Create SVG with overflow visible and no clipping
    const svg = d3.select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('style', 'display: block; margin: 0 auto; overflow: visible;')
        .attr('overflow', 'visible');

    const g = svg.append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    // Create chord layout
    // D3's chord layout automatically sizes arcs proportionally to each person's
    // total relationship value (sum of incoming and outgoing relationships from the matrix)
    const chord = d3.chord()
        .padAngle(0.03)
        .sortSubgroups(null); // Remove sorting so arcs are in their natural order - size reflects relationship count/value

    const chords = chord(matrix);

    // Validate chords result
    if (!chords || !chords.groups || !Array.isArray(chords.groups)) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Failed to generate chord layout.</p>';
        console.error('Invalid chord layout result:', chords);
        return;
    }

    // Color each person based on their personality subtype
    const miiColors = miisData.map((mii) => {
        if (!mii.data || !mii.data.personality || !mii.data.personality.type) {
            // Fallback color if personality data is missing
            return '#cccccc';
        }

        const personalityInfo = getPersonalityDescriptions(mii.data.personality.type);

        // Use subtype color if available, otherwise use main type color, otherwise fallback
        if (personalityInfo.subtype && personalityInfo.subtype.color) {
            return personalityInfo.subtype.color;
        } else if (personalityInfo.mainType && personalityInfo.mainType.color) {
            return personalityInfo.mainType.color;
        }

        return '#cccccc'; // Fallback gray
    });

    // Relationship type colors (matching the ones from getRelationshipsHTML)
    const typeColors = {
        4: '#c93d6b',   // Spouse - pink
        2: '#c45a6f',   // Lover - light pink
        12: '#c4a020',  // Best friend - yellow
        3: '#606060',   // Ex - gray
        9: '#c93d15',   // Friend (in conflict) - orange
        1: '#2d8a83',   // Friend - teal
        0: '#cccccc'    // Unknown/Default - light gray
    };

    // Create or select tooltip (avoid duplicates)
    let tooltip = d3.select('body').select('.chord-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chord-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('background-color', 'rgba(0, 0, 0, 0.8)')
            .style('color', '#fff')
            .style('padding', '8px 12px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1001');
    }

    // Store references to all elements for isolation effect
    let ribbonGroup = g.append('g').attr('class', 'ribbons');
    let arcGroup = g.append('g').attr('class', 'arcs');
    let labelGroup = g.append('g').attr('class', 'labels');

    // Draw chords (ribbons) - minimal style
    ribbonGroup
        .attr('fill-opacity', 0.3)
        .selectAll('path')
        .data(chords)
        .enter()
        .append('path')
        .attr('class', d => `ribbon ribbon-${d.source.index}-${d.target.index}`)
        .attr('data-source', d => d.source.index)
        .attr('data-target', d => d.target.index)
        .attr('fill', d => {
            const relType = typeMatrix[d.source.index][d.target.index];
            return typeColors[relType] || typeColors[0];
        })
        .attr('stroke', 'none')
        .attr('stroke-width', 0)
        .attr('d', d => {
            // Make ribbons thinner for minimal look
            const ribbonRadius = innerRadius - 8;
            return d3.ribbon().radius(ribbonRadius)(d);
        })
        .on('mouseover', function (event, d) {
            d3.select(this).attr('fill-opacity', 0.7);
            const source = miisData[d.source.index];
            const target = miisData[d.target.index];
            const relKey = `${d.source.index}-${d.target.index}`;
            const relInfo = relationshipInfo[relKey] || {};
            const value = relInfo.value || 0;
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            tooltip.html(`${source.nickname} → ${target.nickname}<br/>${relInfo.type_name || 'Unknown'}<br/>Value: ${value.toFixed(0)}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function (d) {
            d3.select(this).attr('fill-opacity', 0.3);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            // Reset all elements
            arcGroup.selectAll('path').attr('opacity', 1).attr('fill-opacity', 1);
            ribbonGroup.selectAll('path').attr('opacity', 1).attr('fill-opacity', 0.3);
            labelGroup.selectAll('text').attr('opacity', 1);
        });

    // Draw arcs (groups)
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius);

    arcGroup
        .selectAll('path')
        .data(chords.groups)
        .enter()
        .append('path')
        .attr('class', d => `arc arc-${d.index}`)
        .attr('data-index', d => d.index)
        .attr('fill', d => miiColors[d.index])
        .attr('stroke', d => d3.rgb(miiColors[d.index]).darker(0.5))
        .attr('stroke-width', 1)
        .attr('d', arc)
        .on('mouseover', function (event, d) {
            const hoveredIndex = d.index;
            d3.select(this).attr('stroke-width', 3);
            const mii = miisData[d.index];
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            tooltip.html(`${mii.nickname}`)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');

            // Gray out everything except this person's relationships
            arcGroup.selectAll('path').each(function (arcData) {
                if (arcData.index !== hoveredIndex) {
                    d3.select(this).attr('opacity', 0.2).attr('fill-opacity', 0.2);
                } else {
                    d3.select(this).attr('opacity', 1).attr('fill-opacity', 1);
                }
            });

            ribbonGroup.selectAll('path').each(function (ribbonData) {
                if (ribbonData.source.index !== hoveredIndex && ribbonData.target.index !== hoveredIndex) {
                    d3.select(this).attr('opacity', 0.1).attr('fill-opacity', 0.1);
                } else {
                    d3.select(this).attr('opacity', 1).attr('fill-opacity', 0.7);
                }
            });

            labelGroup.selectAll('text').each(function (labelData) {
                if (labelData.index !== hoveredIndex) {
                    d3.select(this).attr('opacity', 0.3);
                } else {
                    d3.select(this).attr('opacity', 1);
                }
            });
        })
        .on('mouseout', function (d) {
            d3.select(this).attr('stroke-width', 1);
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            // Reset all elements
            arcGroup.selectAll('path').attr('opacity', 1).attr('fill-opacity', 1);
            ribbonGroup.selectAll('path').attr('opacity', 1).attr('fill-opacity', 0.7);
            labelGroup.selectAll('text').attr('opacity', 1);
        });

    // Add labels - more spread out
    labelGroup
        .selectAll('text')
        .data(chords.groups)
        .enter()
        .append('text')
        .attr('class', d => `label label-${d.index}`)
        .attr('data-index', d => d.index)
        .each(function (d) {
            d.angle = (d.startAngle + d.endAngle) / 2;
        })
        .attr('dy', '.35em')
        .attr('transform', d => `
            rotate(${(d.angle * 180 / Math.PI - 90)})
            translate(${outerRadius + 20})
            ${d.angle > Math.PI ? 'rotate(180)' : ''}
        `)
        .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
        .text(d => miisData[d.index].nickname)
        .style('font-size', '12px')
        .style('fill', '#000')
        .style('font-weight', '400');
}

