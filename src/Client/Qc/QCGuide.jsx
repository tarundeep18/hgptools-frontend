import React, { useEffect, useState } from "react";
import { X, CircleHelp, ClipboardList, FileText } from "lucide-react";

const steps = [
  {
    title: "Overview",
    desc: "Check the summary cards to see overall inspection status.",
  },
  {
    title: "Select Details",
    desc: "Choose Company name, Part No, Drawing name or no.",
  },
  {
    title: "Add Inspection",
    desc: 'Click "Add Inspection" to start a new inspection record.',
  },
  {
    title: "Fill Inspection Info",
    desc: "Enter Date, Shift, Machine, Inspector and Lot details.",
  },
  {
    title: "Add Characteristics",
    desc: "Add product characteristics and their specification limits.",
  },
  {
    title: "Enter Results",
    desc: "Enter the measured value and any observations.",
  },
  {
    title: "Save or Submit",
    desc: "Save as draft or submit the inspection for review.",
  },
];

const stepsGuide = [
  {
    title: "Fill all required details",
  },
  {
    title: "Click add process to add all the process",
  },
  { title: "After that add the checkpoints in all the process" },
   {
   title:"Enter all the measured value for each characteristics" 
  },
  {
    title:"Review the status (Pass/Fail) automatically"
  },
  {
    title:"Submit inspection when all data is correct"
  },
  {
    title:"You have all access the all the fields edit or modify the specification"
  }
];

const QCGuide = () => {
  const [guide, setQuide] = useState(false);
  const [menu, setMenu] = useState(false);
  const [stepsGuide, setStepsGuide] = useState(false);

  return (
    <>
      <aside className="w-90 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-700">
              How to use this QC System
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Follow these simple steps to create a new inspection record.
            </p>
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-5 top-3 bottom-3 w-[2px] bg-gray-200"></div>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={index} className="relative flex gap-4">
                {/* Number Circle */}
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold shadow-sm">
                  {index + 1}
                </div>

                <div>
                  <h3 className="font-semibold text-blue-700">{step.title}</h3>

                  <p className="text-sm text-gray-500 leading-6 mt-1">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CircleHelp className="text-amber-500" size={18} />
            <h3 className="font-semibold text-blue-700">Helpful Tips</h3>
          </div>

          <ul className="space-y-2 text-sm text-gray-600 list-disc pl-5">
            <li>Fields marked with * are mandatory.</li>
            <li>Use Add Characteristic to include multiple checks.</li>
            <li>You can save as draft and continue later.</li>
            <li>Submitted records can be viewed in the dashboard.</li>
          </ul>
        </div>
      </aside>

      <aside className="w-90 bg-white border border-gray-200 rounded-2xl shadow-sm p-5 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold text-blue-700">Need Help?</h2>
            <p className="text-gray-500 text-sm mt-2">Step by Step Guide</p>
          </div>

          <button className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>

          {/* process steps */}
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-5 top-3 bottom-3 w-[2px] bg-gray-200"></div>

            <div className="space-y-6">
              {stepsGuide.map((step, index) => (
                <div key={index} className="relative flex gap-4">
                  {/* Number Circle */}
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-semibold shadow-sm">
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="font-semibold text-blue-700">
                      {step.title}
                    </h3>

                    <p className="text-sm text-gray-500 leading-6 mt-1">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default QCGuide;
