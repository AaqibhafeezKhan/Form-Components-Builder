document.addEventListener("DOMContentLoaded", function () {
  let formElements = [];
  let previewMode = false;

  const savedFormElements = localStorage.getItem("formElements");
  if (savedFormElements) {
    try {
      formElements = JSON.parse(savedFormElements);
    } catch (e) {
      formElements = [];
    }
  }

  const paletteItems = [
    {
      id: "text",
      name: "Text Input",
      defaultProps: { label: "Text Input", placeholder: "Enter text", validation: "" }
    },
    {
      id: "dropdown",
      name: "Dropdown",
      defaultProps: { label: "Dropdown", options: ["Option 1", "Option 2"], validation: "" }
    },
    {
      id: "checkbox",
      name: "Checkbox",
      defaultProps: { label: "Checkbox" }
    },
    {
      id: "radio",
      name: "Radio Button",
      defaultProps: { label: "Radio Button", options: ["Option 1", "Option 2"] }
    },
  ];

  const paletteContainer = document.getElementById("palette");
  const dropzone = document.getElementById("dropzone");
  const previewContainer = document.getElementById("preview");
  const previewForm = document.getElementById("previewForm");
  const editModeContainer = document.getElementById("editMode");
  const togglePreviewBtn = document.getElementById("togglePreview");
  const exportJsonBtn = document.getElementById("exportJson");
  const resetFormBtn = document.getElementById("resetForm");

  const exportModal = document.getElementById("exportModal");
  const closeModal = document.getElementById("closeModal");
  const exportText = document.getElementById("exportText");
  const copyJsonBtn = document.getElementById("copyJson");

  function saveToLocalStorage() {
    localStorage.setItem("formElements", JSON.stringify(formElements));
  }

  function initPalette() {
    paletteItems.forEach((item) => {
      const paletteItemDiv = document.createElement("div");
      paletteItemDiv.className = "palette-item";
      paletteItemDiv.setAttribute("draggable", "true");
      paletteItemDiv.textContent = item.name;
      paletteItemDiv.dataset.paletteId = item.id;

      paletteItemDiv.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", JSON.stringify({ source: "palette", paletteId: item.id }));
        paletteItemDiv.classList.add("dragging");
      });
      paletteItemDiv.addEventListener("dragend", function () {
        paletteItemDiv.classList.remove("dragging");
      });

      paletteContainer.appendChild(paletteItemDiv);
    });
  }

  function renderCanvas() {
    dropzone.innerHTML = "";
    if (formElements.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-canvas";
      emptyMessage.textContent = "Drag components here";
      dropzone.appendChild(emptyMessage);
      return;
    }
    formElements.forEach((element, index) => {
      const itemDiv = document.createElement("div");
      itemDiv.className = "canvas-item";
      itemDiv.setAttribute("draggable", "true");
      itemDiv.dataset.index = index;

      itemDiv.addEventListener("dragstart", function (e) {
        e.dataTransfer.setData("text/plain", JSON.stringify({ source: "canvas", canvasIndex: index }));
        itemDiv.classList.add("dragging");
      });
      itemDiv.addEventListener("dragend", function () {
        itemDiv.classList.remove("dragging");
      });
      itemDiv.addEventListener("dragover", function (e) {
        e.preventDefault();
      });
      itemDiv.addEventListener("drop", handleCanvasItemDrop);

      const headerDiv = document.createElement("div");
      headerDiv.className = "element-header";
      const titleSpan = document.createElement("span");
      titleSpan.textContent = element.type.toUpperCase();
      headerDiv.appendChild(titleSpan);

      const duplicateBtn = document.createElement("button");
      duplicateBtn.className = "duplicate-btn";
      duplicateBtn.textContent = "⧉";
      duplicateBtn.title = "Duplicate Element";
      duplicateBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        duplicateElement(index);
      });
      headerDiv.appendChild(duplicateBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "X";
      deleteBtn.title = "Delete Element";
      deleteBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        deleteElement(index);
      });
      headerDiv.appendChild(deleteBtn);
      itemDiv.appendChild(headerDiv);

      const bodyDiv = document.createElement("div");
      bodyDiv.className = "element-body";

      const labelWrapper = document.createElement("label");
      labelWrapper.textContent = "Label:";
      const labelInput = document.createElement("input");
      labelInput.type = "text";
      labelInput.value = element.props.label || "";
      labelInput.addEventListener("input", function (e) {
        element.props.label = e.target.value;
        saveToLocalStorage();
      });
      labelWrapper.appendChild(labelInput);
      bodyDiv.appendChild(labelWrapper);

      if (element.type === "text") {
        const placeholderWrapper = document.createElement("label");
        placeholderWrapper.textContent = "Placeholder:";
        const placeholderInput = document.createElement("input");
        placeholderInput.type = "text";
        placeholderInput.value = element.props.placeholder || "";
        placeholderInput.addEventListener("input", function (e) {
          element.props.placeholder = e.target.value;
          saveToLocalStorage();
        });
        placeholderWrapper.appendChild(placeholderInput);
        bodyDiv.appendChild(placeholderWrapper);

        const validationWrapper = document.createElement("label");
        validationWrapper.textContent = "Validation:";
        const validationInput = document.createElement("input");
        validationInput.type = "text";
        validationInput.value = element.props.validation || "";
        validationInput.addEventListener("input", function (e) {
          element.props.validation = e.target.value;
          saveToLocalStorage();
        });
        validationWrapper.appendChild(validationInput);
        bodyDiv.appendChild(validationWrapper);
      }
      if (element.type === "dropdown" || element.type === "radio") {
        const optionsWrapper = document.createElement("label");
        optionsWrapper.textContent = "Options (comma separated):";
        const optionsInput = document.createElement("input");
        optionsInput.type = "text";
        optionsInput.value = element.props.options ? element.props.options.join(", ") : "";
        optionsInput.addEventListener("input", function (e) {
          element.props.options = e.target.value.split(",").map(opt => opt.trim());
          saveToLocalStorage();
        });
        optionsWrapper.appendChild(optionsInput);
        bodyDiv.appendChild(optionsWrapper);
      }
      itemDiv.appendChild(bodyDiv);
      dropzone.appendChild(itemDiv);
    });
    saveToLocalStorage();
  }

  function duplicateElement(index) {
    const elementToDuplicate = formElements[index];
    const duplicate = {
      id: "element-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
      type: elementToDuplicate.type,
      props: JSON.parse(JSON.stringify(elementToDuplicate.props))
    };
    formElements.splice(index + 1, 0, duplicate);
    renderCanvas();
  }

  function deleteElement(index) {
    formElements.splice(index, 1);
    renderCanvas();
  }

  function handleCanvasItemDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index, 10);
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }
    if (data.source === "palette") {
      const paletteId = data.paletteId;
      const paletteItem = paletteItems.find(item => item.id === paletteId);
      if (paletteItem) {
        const newElement = {
          id: "element-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type: paletteId,
          props: JSON.parse(JSON.stringify(paletteItem.defaultProps))
        };
        formElements.splice(targetIndex, 0, newElement);
        renderCanvas();
      }
    } else if (data.source === "canvas") {
      let draggedIndex = parseInt(data.canvasIndex, 10);
      if (draggedIndex === targetIndex) return;
      const [draggedElement] = formElements.splice(draggedIndex, 1);
      const adjustedIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      formElements.splice(adjustedIndex, 0, draggedElement);
      renderCanvas();
    }
  }

  function handleDropOnDropzone(e) {
    e.preventDefault();
    let data;
    try {
      data = JSON.parse(e.dataTransfer.getData("text/plain"));
    } catch (err) {
      return;
    }
    if (data.source === "palette") {
      const paletteId = data.paletteId;
      const paletteItem = paletteItems.find(item => item.id === paletteId);
      if (paletteItem) {
        const newElement = {
          id: "element-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5),
          type: paletteId,
          props: JSON.parse(JSON.stringify(paletteItem.defaultProps))
        };
        formElements.push(newElement);
        renderCanvas();
      }
    } else if (data.source === "canvas") {
      let draggedIndex = parseInt(data.canvasIndex, 10);
      if (draggedIndex >= 0 && draggedIndex < formElements.length) {
        const [draggedElement] = formElements.splice(draggedIndex, 1);
        formElements.push(draggedElement);
        renderCanvas();
      }
    }
  }

  function renderPreview() {
    previewForm.innerHTML = "";
    formElements.forEach(element => {
      const formGroup = document.createElement("div");
      formGroup.className = "form-group";
      const { type, props } = element;
      if (type === "text") {
        const labelEl = document.createElement("label");
        labelEl.textContent = props.label;
        const inputEl = document.createElement("input");
        inputEl.type = "text";
        inputEl.placeholder = props.placeholder || "";
        formGroup.appendChild(labelEl);
        formGroup.appendChild(inputEl);
        if (props.validation) {
          const errorMsg = document.createElement("span");
          errorMsg.className = "error-msg";
          errorMsg.textContent = props.validation;
          formGroup.appendChild(errorMsg);
        }
      } else if (type === "dropdown") {
        const labelEl = document.createElement("label");
        labelEl.textContent = props.label;
        const selectEl = document.createElement("select");
        if (props.options && props.options.length > 0) {
          props.options.forEach(opt => {
            const optionEl = document.createElement("option");
            optionEl.value = opt;
            optionEl.textContent = opt;
            selectEl.appendChild(optionEl);
          });
        }
        formGroup.appendChild(labelEl);
        formGroup.appendChild(selectEl);
      } else if (type === "checkbox") {
        const labelEl = document.createElement("label");
        const inputEl = document.createElement("input");
        inputEl.type = "checkbox";
        labelEl.appendChild(inputEl);
        labelEl.appendChild(document.createTextNode(" " + props.label));
        formGroup.appendChild(labelEl);
      } else if (type === "radio") {
        const labelEl = document.createElement("label");
        labelEl.textContent = props.label;
        formGroup.appendChild(labelEl);
        if (props.options && props.options.length > 0) {
          props.options.forEach(opt => {
            const radioLabel = document.createElement("label");
            radioLabel.style.marginRight = "1rem";
            const radioInput = document.createElement("input");
            radioInput.type = "radio";
            radioInput.name = element.id;
            radioInput.value = opt;
            radioLabel.appendChild(radioInput);
            radioLabel.appendChild(document.createTextNode(" " + opt));
            formGroup.appendChild(radioLabel);
          });
        }
      }
      previewForm.appendChild(formGroup);
    });
  }

  dropzone.addEventListener("dragover", function (e) {
    e.preventDefault();
  });
  dropzone.addEventListener("drop", handleDropOnDropzone);

  togglePreviewBtn.addEventListener("click", function () {
    previewMode = !previewMode;
    if (previewMode) {
      editModeContainer.style.display = "none";
      previewContainer.style.display = "block";
      renderPreview();
      togglePreviewBtn.textContent = "Back to Edit";
    } else {
      editModeContainer.style.display = "flex";
      previewContainer.style.display = "none";
      togglePreviewBtn.textContent = "Preview Form";
    }
  });

  exportJsonBtn.addEventListener("click", function () {
    const json = JSON.stringify(formElements, null, 2);
    exportText.value = json;
    exportModal.style.display = "block";
  });

  closeModal.addEventListener("click", function () {
    exportModal.style.display = "none";
  });

  window.addEventListener("click", function (e) {
    if (e.target === exportModal) {
      exportModal.style.display = "none";
    }
  });

  copyJsonBtn.addEventListener("click", function () {
    exportText.select();
    document.execCommand("copy");
    copyJsonBtn.textContent = "Copied!";
    setTimeout(() => {
      copyJsonBtn.textContent = "Copy to Clipboard";
    }, 2000);
  });

  resetFormBtn.addEventListener("click", function () {
    if (confirm("Are you sure you want to reset the form? This cannot be undone.")) {
      formElements = [];
      saveToLocalStorage();
      renderCanvas();
    }
  });

  initPalette();
  renderCanvas();
});
