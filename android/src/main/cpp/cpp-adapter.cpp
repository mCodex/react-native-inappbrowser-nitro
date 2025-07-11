#include <jni.h>
#include "inappbrowsernitroOnLoad.hpp"

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return margelo::nitro::inappbrowsernitro::initialize(vm);
}
