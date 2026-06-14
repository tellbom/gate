<template>
  <el-drawer
    v-model="drawerVisible"
    :title="title"
    :size="width"
    direction="rtl"
    :before-close="handleBeforeClose"
    class="news-editor-drawer editor-drawer"
    destroy-on-close
  >
    <div class="drawer-content">
      <slot name="before-fields"></slot>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        class="news-form"
        @submit.prevent
      >
        <template v-for="field in schema" :key="field.prop">
          <slot :name="`field-${field.prop}`" :field="field" :model="formData">
            <el-form-item
              :label="field.label"
              :prop="field.prop"
              :required="field.required"
            >
              <el-input
                v-if="field.type === 'input'"
                v-model="formData[field.prop]"
                v-bind="field.attrs"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />
              <el-input
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.prop]"
                type="textarea"
                v-bind="field.attrs"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />
              <el-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.prop]"
                v-bind="field.attrs"
                placeholder="请选择"
                clearable
                style="width: 100%"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              >
                <el-option
                  v-for="option in getSelectOptions(field.optionsKey)"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <el-date-picker
                v-else-if="field.type === 'datetime'"
                v-model="formData[field.prop]"
                type="datetime"
                placeholder="选择日期时间"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
                @change="handleFieldChange(field.prop, formData[field.prop])"
              />
              <div v-else-if="field.type === 'tags'" class="tags-input">
                <el-tag
                  v-for="(tag, index) in formData[field.prop]"
                  :key="index"
                  closable
                  @close="removeTag(field.prop, index)"
                  class="tag-item"
                  >{{ tag }}</el-tag
                >
                <el-input
                  v-if="tagInputVisible[field.prop]"
                  ref="tagInputRef"
                  v-model="tagInputValue[field.prop]"
                  size="small"
                  style="width: 100px"
                  @keyup.enter="handleTagInputConfirm(field.prop)"
                  @blur="handleTagInputConfirm(field.prop)"
                />
                <el-button v-else size="small" @click="showTagInput(field.prop)"
                  >+ 添加标签</el-button
                >
              </div>
              <el-upload
                v-else-if="field.type === 'upload'"
                :file-list="uploadFileLists[field.prop] || []"
                :http-request="(params) => handleUploadRequest(params, field)"
                :limit="field.limit"
                :accept="field.accept"
                :list-type="field.listType || 'text'"
                :on-exceed="handleExceed"
                @remove="(file) => handleRemove(file, field)"
              >
                <template v-if="field.listType === 'picture-card'"
                  ><el-icon><Plus /></el-icon
                ></template>
                <template v-else
                  ><el-button type="primary" size="small"
                    ><el-icon><Upload /></el-icon>点击上传</el-button
                  ></template
                >
              </el-upload>
              <div v-else-if="field.type === 'editor'" class="editor-wrapper">
                <UmoEditor
                  :ref="(el) => setEditorRef(el, field.prop)"
                  v-bind="editorOptions"
                  @created="(e) => onEditorCreated(e, field.prop)"
                  @changed="(e) => onEditorChanged(e, field.prop)"
                >
                  <template #toolbar_insert>
                    <!-- 隐藏的文件选择 -->
                    <input
                        :ref="(el) => setFileInputRef(el, field.prop)"
                        type="file"
                        multiple
                        style="display:none"
                        @change="(e) => onFilePicked(e, field.prop)"
                    />

                    <!-- ✅ 自己的按钮容器，避免被外层样式裁掉 -->
                    <div class="umo-toolbar-custom-group">
                        <button
                        class="umo-button umo-button--theme-default"
                        type="button"
                        tabindex="0"
                        @click="pickFile(field.prop)"
                        >
                        <div class="umo-button-content">
                            <i class="fa fa-file"></i>
                            <p class="umo-button-text">附件</p>
                        </div>
                        </button>

                        <button
                        class="umo-button umo-button--theme-primary"
                        type="button"
                        tabindex="0"
                        @click="handlePreview(field.prop)"
                        >
                        <div class="umo-button-content">
                            <i class="fa fa-eye"></i>
                            <p class="umo-button-text">预览</p>
                        </div>
                        </button>
                    </div>
                    </template>

                </UmoEditor>
              </div>
            </el-form-item>
          </slot>
        </template>
      </el-form>
      <slot name="after-fields"></slot>
    </div>
    <template #footer>
      <slot name="footer" :submit="handleSubmit" :cancel="handleCancel">
        <div class="drawer-footer">
          <el-button @click="handleCancel">取消</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="submitting"
            >{{ mode === "create" ? "创建" : "保存" }}</el-button
          >
        </div>
      </slot>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload } from "@element-plus/icons-vue";
import { UmoEditor } from "@umoteam/editor";
import { adminBaseRoutePath } from '/@/router/static/adminBase'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  model: { type: Object, default: () => ({}) },
  mode: { type: String, default: "create" },
  schema: { type: Array, default: () => [] },
  selectOptions: { type: Object, default: () => ({}) },
  uploadConfig: { type: Object, default: () => ({}) },
  editorOptions: { type: Object, default: () => ({}) },
  title: { type: String, default: "" },
  width: { type: [Number, String], default: 720 },
  theme: {
    type: Object,
    default: () => ({
      primary: "#1E90FF",
      hover: "#5AA9FF",
      border: "#CCE0FF",
    }),
  },
});

const emit = defineEmits([
  "update:modelValue",
  "submit",
  "cancel",
  "change",
  "validate",
  "umoupload", // UmoEditor 附件上传
  "file-upload", // el-upload 组件上传
]);

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const formRef = ref(null);
const formData = reactive({});
const submitting = ref(false);
const editorInstances = reactive(new Map());
const editorRefs = reactive(new Map());
const fileInputRefs = reactive(new Map());
const uploadFileLists = reactive({});
const tagInputVisible = reactive({});
const tagInputValue = reactive({});
const tagInputRef = ref(null);

const editorFields = computed(() =>
  props.schema.filter((field) => field.type === "editor")
);
const setEditorRef = (el, fieldProp) => {
  if (el) editorRefs.set(fieldProp, el);
};
const setFileInputRef = (el, fieldProp) => {
  if (el) fileInputRefs.set(fieldProp, el);
};

const urlToFileItem = (url, index = 0) => ({
  uid: Date.now() + index,
  name: url.split("/").pop() || `file-${index}`,
  url,
  status: "success",
});

const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj || {}));

const initFormData = () => {
  Object.keys(formData).forEach((key) => delete formData[key]);
  Object.assign(formData, cloneDeep(props.model));
  props.schema.forEach((field) => {
    if (!(field.prop in formData)) {
      if (field.type === "tags") formData[field.prop] = [];
      else if (field.type === "upload") formData[field.prop] = [];
      else formData[field.prop] = "";
    }
    if (field.type === "upload") {
      const value = formData[field.prop];
      if (!value) uploadFileLists[field.prop] = [];
      else if (typeof value === "string")
        uploadFileLists[field.prop] = [urlToFileItem(value, 0)];
      else if (Array.isArray(value))
        uploadFileLists[field.prop] = value
          .filter(Boolean)
          .map((url, i) => urlToFileItem(url, i));
      else uploadFileLists[field.prop] = [];
    }
  });
};

const syncEditorsContent = () => {
  editorFields.value.forEach((field) => {
    const fieldProp = field.prop;
    const editorRef = editorRefs.get(fieldProp);
    const content = formData[fieldProp];
    if (editorRef && content) {
      nextTick(() => {
        const editorElement = Array.isArray(editorRef)
          ? editorRef[0]
          : editorRef;
        if (editorElement && editorElement.setContent) {
          try {
            editorElement.setContent(content, {
              emitUpdate: false,
              focusPosition: "start",
              focusOptions: { scrollIntoView: false },
            });
          } catch (error) {
            console.error(`❌ 编辑器 [${fieldProp}] 内容同步失败:`, error);
          }
        }
      });
    }
  });
};

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      initFormData();
      nextTick(() => {
        syncEditorsContent();
        formRef.value?.clearValidate();
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.model,
  (newModel) => {
    if (drawerVisible.value) {
      Object.assign(formData, newModel);
      nextTick(() => {
        syncEditorsContent();
      });
    }
  },
  { deep: false }
);

const formRules = computed(() => {
  const rules = {};
  props.schema.forEach((field) => {
    if (field.rules) rules[field.prop] = field.rules;
    else if (field.required) {
      rules[field.prop] = [
        {
          required: true,
          message: `${field.label}不能为空`,
          trigger: ["blur", "change"],
        },
      ];
    }
  });
  return rules;
});

const getSelectOptions = (optionsKey) => props.selectOptions[optionsKey] || [];

const handleFieldChange = (prop, value) => {
  emit("change", { prop, value });
};

const removeTag = (prop, index) => {
  formData[prop].splice(index, 1);
};

const showTagInput = (prop) => {
  tagInputVisible[prop] = true;
  nextTick(() => {
    const inputRefArray = tagInputRef.value;
    if (Array.isArray(inputRefArray) && inputRefArray.length)
      inputRefArray[0]?.focus();
    else tagInputRef.value?.focus();
  });
};

const handleTagInputConfirm = (prop) => {
  const value = tagInputValue[prop];
  if (value && !formData[prop].includes(value)) formData[prop].push(value);
  tagInputVisible[prop] = false;
  tagInputValue[prop] = "";
};

// ✅ el-upload 组件的上传处理
const handleUploadRequest = async ({ file, onSuccess, onError }, field) => {
  console.log("🔥 handleUploadRequest 被调用", {
    fileName: file.name,
    fieldProp: field.prop,
  });

  try {
    // 文件类型验证
    const acceptTypes = field.accept
      ? field.accept.split(",").map((t) => t.trim())
      : [];
    const maxSize = field.maxSize || 10 * 1024 * 1024; // 默认 10MB

    console.log("📋 验证配置", {
      acceptTypes,
      maxSize,
      fileType: file.type,
      fileSize: file.size,
    });

    if (acceptTypes.length > 0) {
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      const mimeType = file.type;
      const isValidType = acceptTypes.some((accept) => {
        if (accept.startsWith(".")) {
          return fileExtension === accept.toLowerCase();
        } else if (accept.includes("*")) {
          const typePrefix = accept.split("/")[0];
          return mimeType.startsWith(typePrefix);
        } else {
          return mimeType === accept;
        }
      });

      if (!isValidType) {
        console.error("❌ 文件类型验证失败", {
          fileExtension,
          mimeType,
          acceptTypes,
        });
        ElMessage.error(`文件类型不支持，请上传 ${field.accept} 格式的文件`);
        onError(new Error("文件类型不支持"));
        return;
      }
    }

    // 文件大小验证
    if (file.size > maxSize) {
      const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
      console.error("❌ 文件大小验证失败", { fileSize: file.size, maxSize });
      ElMessage.error(`文件大小不能超过 ${sizeMB}MB`);
      onError(new Error("文件大小超限"));
      return;
    }

    console.log("✅ 文件验证通过，开始上传...");

    // 使用回调函数处理 el-upload 上传
    emit(
      "file-upload",
      file,
      (result) => {
        // 上传成功的回调
        console.log("✅ 上传成功回调", result);
        const fileItem = {
          uid: result.id || Date.now(),
          name: result.name || file.name,
          url: result.url,
          status: "success",
        };

        if (!uploadFileLists[field.prop]) {
          uploadFileLists[field.prop] = [];
        }
        uploadFileLists[field.prop].push(fileItem);

        // ✅ 关键修复：同步更新 formData，确保表单验证能通过
        if (field.limit === 1) {
          // 单文件上传，直接设置 URL 字符串
          formData[field.prop] = result.url;
        } else {
          // 多文件上传，设置 URL 数组
          if (!Array.isArray(formData[field.prop])) {
            formData[field.prop] = [];
          }
          formData[field.prop].push(result.url);
        }

        console.log("✅ formData 已更新", {
          prop: field.prop,
          value: formData[field.prop],
        });

        // 触发表单验证，清除错误提示
        nextTick(() => {
          formRef.value?.validateField(field.prop);
        });

        onSuccess(result);
        ElMessage.success(`${file.name} 上传成功`);
      },
      (error) => {
        // 上传失败的回调
        console.error("❌ 上传失败回调:", error);
        onError(error);
        ElMessage.error(`${file.name} 上传失败`);
      }
    );
  } catch (error) {
    console.error("❌ 上传请求处理失败:", error);
    onError(error);
    ElMessage.error("上传请求处理失败");
  }
};

const handleExceed = (files, fileList) => {
  ElMessage.warning(`当前限制上传 ${fileList.length} 个文件，请删除后再试`);
};

const handleRemove = (file, field) => {
  console.log("🗑️ 删除文件", { fileName: file.name, fieldProp: field.prop });

  const index = uploadFileLists[field.prop].findIndex(
    (item) => item.uid === file.uid
  );

  if (index > -1) {
    // 从显示列表中删除
    uploadFileLists[field.prop].splice(index, 1);

    // ✅ 关键修复：同步更新 formData
    if (field.limit === 1) {
      // 单文件上传，清空
      formData[field.prop] = "";
    } else {
      // 多文件上传，从数组中删除对应的 URL
      if (Array.isArray(formData[field.prop])) {
        formData[field.prop].splice(index, 1);
      }
    }

    console.log("✅ formData 已更新（删除后）", {
      prop: field.prop,
      value: formData[field.prop],
    });

    // 触发表单验证
    nextTick(() => {
      formRef.value?.validateField(field.prop);
    });
  }
};

function onEditorCreated({ editor }, fieldProp) {
  editorInstances.set(fieldProp, editor);
  nextTick(() => {
    if (formData[fieldProp]) {
      try {
        const editorRef = editorRefs.get(fieldProp);
        const editorElement = Array.isArray(editorRef)
          ? editorRef[0]
          : editorRef;
        if (editorElement && editorElement.setContent)
          editorElement.setContent(formData[fieldProp], {
            emitUpdate: false,
            focusPosition: "start",
            focusOptions: { scrollIntoView: false },
          });
      } catch (error) {
        console.error(`❌ 编辑器 [${fieldProp}] 设置初始内容失败:`, error);
      }
    }
  });
}

function onEditorChanged({ editor }, fieldProp) {
  if (editor) formData[fieldProp] = editor.getHTML();
}

// 预览页面内容
// 仅渲染被点击的实例
const handlePreview = (fieldProp) => {
  const editor = editorInstances.get(fieldProp);
  if (!editor) {
    // 你项目里如果没用 ElementPlus，就换成你现有的提示方法
    // @ts-ignore
    ElMessage?.warning?.('当前编辑器尚未就绪');
    return;
  }

  // 1) 拿当前实例的 HTML
  const html = editor.getHTML?.() ?? '';

  // 2) 存到 sessionStorage（带上实例 key，互不干扰）
  try {
    localStorage.setItem(`PREVIEW_HTML_${fieldProp}`, html);
  } catch (e) {
    ElMessage?.warning?.('写入 localStorage 失败：', e);
  }

  // 3) 打开预览路由，并把实例 key 传过去（预览页按 sid 读对应内容）
  const url = adminBaseRoutePath+`/preview/index?sid=${encodeURIComponent(fieldProp)}&t=${Date.now()}`;
  // console.log(url)
  window.open(url, '_blank', 'noopener,noreferrer');
};


function pickFile(fieldProp) {
  const fileInputRef = fileInputRefs.get(fieldProp);
  if (fileInputRef) {
    if (Array.isArray(fileInputRef)) fileInputRef[0]?.click();
    else fileInputRef?.click();
  }
}

// ✅ UmoEditor 附件上传处理
function uploadAttachment(file, onSuccess, onError) {
  emit("umoupload", file, onSuccess, onError);
}

function buildPreviewUrl(url, filename) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext || ""))
    return `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
      url
    )}`;
  if (ext === "pdf") return url;
  return url;
}

async function onFilePicked(e, fieldProp) {
  const files = Array.from(e.target?.files || []);
  e.target.value = "";
  if (files.length === 0) return;
  const editorInstance = editorInstances.get(fieldProp);
  if (!editorInstance) {
    ElMessage.error(`编辑器未就绪`);
    return;
  }

  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      ElMessage.error(`${file.name} 超过 20MB，已跳过`);
      continue;
    }

    try {
      ElMessage.info(`正在上传 ${file.name}...`);

      // 使用回调函数处理 UmoEditor 附件上传
      uploadAttachment(
        file,
        (result) => {
          // 上传成功
          const previewUrl = buildPreviewUrl(result.url, file.name);
          editorInstance
            .chain()
            .focus()
            .insertContent({
              type: "attachment",
              attrs: {
                id: result.id ?? null,
                url: result.url,
                name: file.name,
                size: file.size,
                type: file.type,
                previewUrl: previewUrl,
              },
            })
            .run();
          ElMessage.success(`${file.name} 上传成功`);
        },
        (error) => {
          // 上传失败
          console.error(`❌ ${file.name} 上传失败:`, error);
          ElMessage.error(`${file.name} 上传失败`);
        }
      );
    } catch (error) {
      console.error(`❌ ${file.name} 处理失败:`, error);
      ElMessage.error(`${file.name} 处理失败`);
    }
  }
}

const handleSubmit = async () => {
  try {
    console.log("📝 提交前的 formData:", JSON.parse(JSON.stringify(formData)));
    console.log(
      "📋 提交前的 uploadFileLists:",
      JSON.parse(JSON.stringify(uploadFileLists))
    );

    const valid = await formRef.value.validate();
    if (!valid) {
      console.error("❌ 表单验证失败");
      emit("validate", { valid: false, errors: formRef.value.fields });
      return;
    }

    console.log("✅ 表单验证通过");
    submitting.value = true;
    const payload = { ...formData };

    // ⚠️ 兜底方案：从 uploadFileLists 重新构建 URL 数据
    // 正常情况下 formData 已经包含正确的 URL，这里只是双重保险
    props.schema
      .filter((f) => f.type === "upload")
      .forEach((field) => {
        const fileList = uploadFileLists[field.prop] || [];
        const urls = fileList.map((item) => item.url).filter(Boolean);
        if (field.limit === 1) payload[field.prop] = urls[0] || "";
        else payload[field.prop] = urls;
      });

    console.log("📤 最终提交的 payload:", JSON.parse(JSON.stringify(payload)));

    if (props.mode === "edit" && props.model?.id) payload.id = props.model.id;
    if (payload.status === "published" && !payload.publishTime)
      payload.publishTime = new Date().toISOString();
    emit("submit", payload);
    emit("validate", { valid: true, errors: null });
    drawerVisible.value = false;
    ElMessage.success(props.mode === "create" ? "创建成功" : "保存成功");
  } catch (error) {
    console.error("❌ 表单验证失败:", error);
    emit("validate", { valid: false, errors: error });
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
  drawerVisible.value = false;
};

const handleBeforeClose = (done) => {
  const hasChanges = Object.keys(formData).some(
    (key) => JSON.stringify(formData[key]) !== JSON.stringify(props.model[key])
  );
  if (hasChanges) {
    ElMessageBox.confirm("您有未保存的修改，确定要关闭吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
      .then(() => {
        editorInstances.clear();
        editorRefs.clear();
        fileInputRefs.clear();
        done();
      })
      .catch(() => {});
  } else {
    editorInstances.clear();
    editorRefs.clear();
    fileInputRefs.clear();
    done();
  }
};

defineExpose({
  open: (initModel) => {
    if (initModel) Object.assign(formData, initModel);
    drawerVisible.value = true;
  },
  close: () => {
    drawerVisible.value = false;
  },
  validate: () => formRef.value.validate(),
  reset: () => {
    formRef.value.resetFields();
    initFormData();
  },
  setFieldValue: (prop, val) => {
    formData[prop] = val;
  },
  getEditorInstance: (fieldProp) => editorInstances.get(fieldProp),
  getAllEditorInstances: () => editorInstances,
});
</script>

<style lang="scss">
.editor-drawer{
   top: 48px !important;
    height: calc(100% - 48px) !important;
}
.umo-button-content {
  .fa-file::before {
    font-size: 1.5em;
  }
}
.umo-toolbar-custom-group{
  display:flex;
  align-items:center;
  margin-top: 8px;
  gap:10px;          /* 两按钮间距 */
  flex-wrap:nowrap; /* 防止被换行挤掉 */
}

.umo-toolbar-custom-group .umo-button{
  display:inline-flex;    /* 别用 block 占满整行 */
  white-space:nowrap;     /* 避免文字换行导致高度超出 */
  max-width:unset;        /* 如主题里有 max-width 可取消 */
}

</style>

<style scoped>
.news-editor-drawer {

  --news-primary: v-bind("theme.primary");
  --news-primary-hover: v-bind("theme.hover");
  --news-border: v-bind("theme.border");
}
.drawer-content {
  padding: 20px;
  height: calc(100% - 60px);
  overflow-y: auto;
}
.news-form {
  max-width: 100%;
}
:deep(.el-form-item) {
  margin-bottom: 24px;
}
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 8px;
}
:deep(.el-input__inner),
:deep(.el-textarea__inner),
:deep(.el-select) {
  border-radius: 6px;
  border-color: var(--news-border);
}
:deep(.el-input__inner:focus),
:deep(.el-textarea__inner:focus) {
  border-color: var(--news-primary);
}
:deep(.el-button--primary) {
  background-color: var(--news-primary);
  border-color: var(--news-primary);
  border-radius: 6px;
}
:deep(.el-button--primary:hover) {
  background-color: var(--news-primary-hover);
  border-color: var(--news-primary-hover);
}
.tags-input {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
.tag-item {
  border-radius: 4px;
}
.editor-wrapper {
  border: 1px solid var(--news-border);
  border-radius: 6px;
  overflow: hidden;
  min-height: 400px;
}
.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  color: #1f2937;
}
:deep(.el-drawer__body) {
  padding: 0;
}
</style>