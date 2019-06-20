var serverSystem = server.registerSystem(0, 0);
var queries = {};
var inventoryCache = {};

// Setup which events to listen for
serverSystem.initialize = function () {
	// set up your listenToEvents and register server-side components here.

    queries.inventoryQuery = serverSystem.registerQuery();

    serverSystem.registerEventData("bookshelf_storage:inventory_update", { entity_uid: {}, inventory_fullness: 0 });

    serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => serverSystem.onPlacedBlock(eventData));
}

// per-tick updates
serverSystem.update = function () {
	// Any logic that needs to happen every tick on the server.
    //update bookshelf inventory levels
    let ents = serverSystem.getEntitiesFromQuery(queries.inventoryQuery);

    ents.forEach(ent => {
        //check bookshelf inventory level
        if (ent.__identifier__ === "bookshelf_storage:bookshelf_storage_entity") {
            checkInventoryLevel(ent);
        }
    });
}

serverSystem.chat = function (message) {
    const eventData = this.createEventData("minecraft:display_chat_event");
    eventData.data.message = message;
    this.broadcastEvent("minecraft:display_chat_event", eventData);
};

serverSystem.onPlacedBlock = function (eventData) {
    let player = eventData.data.player;
    let position = eventData.data.block_position;

    //get player ticking area
    let tickingArea = serverSystem.getComponent(player, "minecraft:tick_world").data.ticking_area;

    if (position !== null && tickingArea) {
        //getBlock and check whether it's a bookshelf_storage block
        let placedBlock = serverSystem.getBlock(tickingArea, position);

        //only continue if it's a bookshelf storage block
        if (placedBlock.__identifier__ === "bookshelf_storage:bookshelf_storage") {
            //remove bookshelf block at position
            serverSystem.executeCommand(`/setblock ${position.x} ${position.y} ${position.z} air`, (commandResultData) => {
                //spawn the bookshelf after the block is removed
                spawnBookshelf(position);
            });
        }
    }
}

//spawn a bookshelf_storage entity at location
function spawnBookshelf(position) {
    let bookshelf = serverSystem.createEntity("entity", "bookshelf_storage:bookshelf_storage_entity");
    if (bookshelf !== null) {
        //set the position
        //adjust entity position to be in the middle of the block square
        let bookshelf_position = serverSystem.getComponent(bookshelf, "minecraft:position");
        bookshelf_position.data.x = position.x + 0.5;
        bookshelf_position.data.y = position.y;
        bookshelf_position.data.z = position.z + 0.5;

        serverSystem.applyComponentChanges(bookshelf, bookshelf_position);

        //serverSystem.chat("Spawned bookshelf")
    }
}

function checkInventoryLevel(bookshelf_entity) {
    let inventory = serverSystem.getComponent(bookshelf_entity, "minecraft:inventory").data;
    let inventoryContainer = serverSystem.getComponent(bookshelf_entity, "minecraft:inventory_container").data;

    //currently only have 0, 1, 2
    let fullness = 0
    let inventorySize = inventoryContainer.filter(e => e.item !== "minecraft:undefined").length;

    //count the number of slots that are not empty
    if (inventorySize >= inventory.inventory_size) {
        fullness = 2;
    } else if (inventorySize > 0) {
        fullness = 1
    }

    //
    let firstTime = false;
    if (!inventoryCache.hasOwnProperty(bookshelf_entity.id)) {
        inventoryCache[bookshelf_entity.id] = fullness;
        firstTime = true;
    }

    //only update if changed
    if (inventoryCache[bookshelf_entity.id] !== fullness || firstTime) {
        inventoryCache[bookshelf_entity.id] = fullness;
        let inventoryUpdateData = serverSystem.createEventData("bookshelf_storage:inventory_update")
        inventoryUpdateData.data.entity_uid = bookshelf_entity.__unique_id__;
        inventoryUpdateData.data.inventory_fullness = fullness;

        serverSystem.broadcastEvent("bookshelf_storage:inventory_update", inventoryUpdateData);
    }
}