// File: all.js

class NotesAPI {
    static getAllNotes() {
        const notes = JSON.parse(localStorage.getItem("notesapp-notes") || "[]");

        return notes.sort((a, b) => {
            return new Date(a.updated) > new Date(b.updated) ? -1 : 1;
        });
    }

    static saveNote(noteToSave) {
        const notes = NotesAPI.getAllNotes();
        const existing = notes.find(note => note.id == noteToSave.id);

        if (existing) {
            existing.title = noteToSave.title;
            existing.body = noteToSave.body;
            existing.updated = new Date().toISOString();
        } else {
            noteToSave.id = Math.floor(Math.random() * 1000000);
            noteToSave.updated = new Date().toISOString();
            notes.push(noteToSave);
        }

        localStorage.setItem("notesapp-notes", JSON.stringify(notes));
    }

    static deleteNote(id) {
        const notes = NotesAPI.getAllNotes();
        const newNotes = notes.filter(note => note.id != id);

        localStorage.setItem("notesapp-notes", JSON.stringify(newNotes));
    }
}


class NotesView {
    constructor(root, { onNoteSelect, onNoteAdd, onNoteEdit, onNoteDelete } = {}) {
        this.root = root;
        this.onNoteSelect = onNoteSelect;
        this.onNoteAdd = onNoteAdd;
        this.onNoteEdit = onNoteEdit;
        this.onNoteDelete = onNoteDelete;
        this.root.innerHTML = `
            <div class="notes__sidebar">
            <h3>Please click on the button below to add notes you want... enjoy !!</h3>
                <button class="notes__add" type="button">Add Note</button>
                <div class="notes__list"></div>
            </div>
            <div class="notes__preview">
                <input class="notes__title" type="text" placeholder="New Note...">
                <textarea class="notes__body">Take Note...</textarea>
            </div>
        `;

        const btnAddNote = this.root.querySelector(".notes__add");
        const inpTitle = this.root.querySelector(".notes__title");
        const inpBody = this.root.querySelector(".notes__body");

        btnAddNote.addEventListener("click", () => {
            this.onNoteAdd();
        });

        [inpTitle, inpBody].forEach(inputField => {
            inputField.addEventListener("blur", () => {
                const updatedTitle = inpTitle.value.trim();
                const updatedBody = inpBody.value.trim();

                this.onNoteEdit(updatedTitle, updatedBody);
            });
        });

        this.updateNotePreviewVisibility(false);
    }

    _createListItemHTML(id, title, body, updated) {
        const MAX_BODY_LENGTH = 60;

        return `
            <div class="notes__list-item" data-note-id="${id}">
                <div class="notes__small-title">${title}</div>
                <div class="notes__small-body">
                    ${body.substring(0, MAX_BODY_LENGTH)}
                    ${body.length > MAX_BODY_LENGTH ? "..." : ""}
                </div>
                <div class="notes__small-updated">
                    ${updated.toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" })}
                </div>
                <button class="notes__delete-btn" type="button">Delete</button>
            </div>
        `;
    }

    updateNoteList(notes) {
        const notesListContainer = this.root.querySelector(".notes__list");

        notesListContainer.innerHTML = "";

        for (const note of notes) {
            const html = this._createListItemHTML(note.id, note.title, note.body, new Date(note.updated));

            const noteListItem = document.createElement("div");
            noteListItem.classList.add("notes__list-item");
            noteListItem.classList.add("notes-main-div");
            noteListItem.dataset.noteId = note.id;
            noteListItem.innerHTML = html;


            noteListItem.addEventListener("click", () => {
                this.onNoteSelect(noteListItem.dataset.noteId);
            });

           
            const deleteButton = noteListItem.querySelector(".notes__delete-btn");
            deleteButton.addEventListener("click", (event) => {
                event.stopPropagation();
                this.onNoteDelete(noteListItem.dataset.noteId);
            });

            notesListContainer.appendChild(noteListItem);
        }
    }

    updateActiveNote(note) {
        this.root.querySelector(".notes__title").value = note.title;
        this.root.querySelector(".notes__body").value = note.body;

        this.root.querySelectorAll(".notes__list-item").forEach(noteListItem => {
            noteListItem.classList.remove("notes__list-item--selected");
        });

        this.root.querySelector(`.notes__list-item[data-note-id="${note.id}"]`).classList.add("notes__list-item--selected");
    }

    updateNotePreviewVisibility(visible) {
        this.root.querySelector(".notes__preview").style.visibility = visible ? "visible" : "hidden";
    }
}


class App {
    constructor(root) {
        this.notes = [];
        this.activeNote = null;
        this.view = new NotesView(root, this._handlers());

        this._refreshNotes();
    }

    _refreshNotes() {
        const notes = NotesAPI.getAllNotes();

        this._setNotes(notes);

        if (notes.length > 0) {
            this._setActiveNote(notes[0]);
        }
    }

    _setNotes(notes) {
        this.notes = notes;
        this.view.updateNoteList(notes);
        this.view.updateNotePreviewVisibility(notes.length > 0);
    }

    _setActiveNote(note) {
        this.activeNote = note;
        this.view.updateActiveNote(note);
    }

    _handlers() {
        return {
            onNoteSelect: noteId => {
                const selectedNote = this.notes.find(note => note.id == noteId);
                this._setActiveNote(selectedNote);
            },
            onNoteAdd: () => {
                const newNote = {
                    title: "Add a title...",
                    body: "Take note..."
                };

                NotesAPI.saveNote(newNote);
                this._refreshNotes();
            },
            onNoteEdit: (title, body) => {
                NotesAPI.saveNote({
                    id: this.activeNote.id,
                    title,
                    body
                });

                this._refreshNotes();
            },
            onNoteDelete: noteId => {
                NotesAPI.deleteNote(noteId);
                this._refreshNotes();
            },
        };
    }
}


const root = document.getElementById("app");
const app = new App(root);
