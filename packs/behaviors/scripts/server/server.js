var serverSystem = server.registerSystem(0, 0);

// Setup which events to listen for
serverSystem.initialize = function () {
	// set up your listenToEvents and register server-side components here.

    serverSystem.listenForEvent("minecraft:player_placed_block", (eventData) => serverSystem.onPlacedBlock(eventData));
}

// per-tick updates
serverSystem.update = function () {
	// Any logic that needs to happen every tick on the server.
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
        let bookshelf_position = serverSystem.getComponent(bookshelf, "minecraft:position");
        bookshelf_position.data.x = position.x;
        bookshelf_position.data.y = position.y;
        bookshelf_position.data.z = position.z;

        serverSystem.applyComponentChanges(bookshelf, bookshelf_position);

        //serverSystem.chat("Spawned bookshelf")
    }
}